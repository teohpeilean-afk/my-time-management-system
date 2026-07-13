import { describe, expect, it } from "vitest";
import { buildQrPayload, parseQrPayload } from "./qr";

const LOC = "043d24a3-e321-4e42-b985-1379c1678947";
const SECRET = "8b2d91da-6076-4507-9578-2e808e4c735c";

describe("parseQrPayload", () => {
  it("round-trips a payload built by buildQrPayload", () => {
    expect(parseQrPayload(buildQrPayload(LOC, SECRET))).toEqual({
      locationId: LOC,
      secret: SECRET,
    });
  });

  it("tolerates surrounding whitespace from scanners", () => {
    expect(parseQrPayload(`  TMS|${LOC}|${SECRET}\n`)).not.toBeNull();
  });

  it("rejects the wrong prefix", () => {
    expect(parseQrPayload(`XYZ|${LOC}|${SECRET}`)).toBeNull();
  });

  it("rejects missing or extra segments", () => {
    expect(parseQrPayload(`TMS|${LOC}`)).toBeNull();
    expect(parseQrPayload(`TMS|${LOC}|${SECRET}|extra`)).toBeNull();
  });

  it("rejects non-UUID segments", () => {
    expect(parseQrPayload(`TMS|not-a-uuid|${SECRET}`)).toBeNull();
    expect(parseQrPayload(`TMS|${LOC}|not-a-uuid`)).toBeNull();
  });

  it("rejects arbitrary scanned junk (URLs, product barcodes)", () => {
    expect(parseQrPayload("https://example.com/attack")).toBeNull();
    expect(parseQrPayload("9556001234567")).toBeNull();
    expect(parseQrPayload("")).toBeNull();
  });
});
