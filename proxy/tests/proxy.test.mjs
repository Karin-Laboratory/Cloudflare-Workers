import test from "node:test";
import assert from "node:assert/strict";
import {checkTarget} from "../worker.js";
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
  for(const value of ["example.com\\@site.com","example.com\n","https://example.com:8443","https://foo.invalid"])
    assert.throws(()=>checkTarget(value),value);
});
