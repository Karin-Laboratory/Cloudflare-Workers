import test from "node:test";
import assert from "node:assert/strict";
import {checkTarget, detectCharset, decodeResponseBody, decodeUrlEntities} from "../worker.js";
test("public HTTPS hosts",()=>{
  assert.equal(checkTarget("example.com/a?b=1").href,"https://example.com/a?b=1");
  assert.equal(checkTarget("https://www.wikipedia.org/").origin,"https://www.wikipedia.org");
});
test("reject local destinations and non-HTTPS",()=>{
  for(const value of ["localhost","http://example.com","https://127.0.0.1","https://[::1]/","https://a.local","https://10.0.0.1","https://mykeep.karin-lab.com","https://proxy.karin-lab.com","https://name:pass@example.com","file:///etc/passwd","https://abc.nip.io"]) {
    assert.throws(()=>checkTarget(value),value);
  }
});
test("reject control characters, backslash URLs, unsupported ports",()=>{
  for(const value of ["example.com\\@site.com","exa\nmple.com","https://example.com:8443","https://foo.invalid"])
    assert.throws(()=>checkTarget(value),value);
});

test("decode Shift_JIS from HTTP charset, preserving Japanese",()=>{
  const bytes=Uint8Array.from([0x82,0xb1,0x82,0xf1,0x82,0xc9,0x82,0xbf,0x82,0xcd]);
  assert.equal(detectCharset(bytes,"text/html; charset=Shift_JIS"),"Shift_JIS");
  assert.equal(decodeResponseBody(bytes,"text/html; charset=Shift_JIS"),"こんにちは");
});
test("sniff legacy encoding from HTML meta when HTTP charset is absent",()=>{
  const header=new TextEncoder().encode('<!doctype html><html><head><meta http-equiv="Content-Type" content="text/html; charset=Shift_JIS"></head><body>');
  const bytes=new Uint8Array([...header,0x82,0xb1,0x82,0xf1,0x82,0xc9,0x82,0xbf,0x82,0xcd]);
  assert.equal(detectCharset(bytes,"text/html"),"Shift_JIS");
  assert.match(decodeResponseBody(bytes,"text/html"),/こんにちは/);
});
test("UTF-8 remains UTF-8 and Unicode is preserved",()=>{
  const bytes=new TextEncoder().encode('<meta charset="utf-8">日本語テスト');
  assert.equal(detectCharset(bytes,"text/html"),"utf-8");
  assert.match(decodeResponseBody(bytes,"text/html"),/日本語テスト/);
});
test("decode HTML-escaped ampersands in links before proxying",()=>{
  assert.equal(decodeUrlEntities("?hl=ja&amp;authuser=0"),"?hl=ja&authuser=0");
  assert.equal(decodeUrlEntities("?hl=ja&amp;amp;authuser=0"),"?hl=ja&authuser=0");
  assert.equal(decodeUrlEntities("?hl=ja&#38;authuser=0"),"?hl=ja&authuser=0");
});
