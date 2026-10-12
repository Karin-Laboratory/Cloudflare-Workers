import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
const app=readFileSync(new URL("../app.txt",import.meta.url),"utf8");
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const worker=readFileSync(new URL("../worker.js",import.meta.url),"utf8");
assert.match(app,/window\.x_spreadsheet\("#spreadsheet"/,"Spreadsheet must call the x_spreadsheet browser global");
assert.doesNotMatch(app,/window\.x\.spreadsheet/,"Do not use a nonexistent browser global");
assert.doesNotMatch(app,/if\(!window\.x\|\|!window\.XLSX\)/,"Missing SheetJS must not prevent editor startup");
for(const path of ["/vendor/xspreadsheet.js","/vendor/xspreadsheet.css","/vendor/xlsx.full.min.js"]){
  assert.ok(html.includes(path),"Missing same-origin vendor link: "+path);
  assert.ok(worker.includes('"' +path+ '"'),"Missing Worker vendor route: "+path);
}
assert.match(worker,/if\(Object\.prototype\.hasOwnProperty\.call\(vendors,url\.pathname\)\)return vendor\(req,url\.pathname\)/,"Vendor requests must be served by Worker");
console.log("Karin Excel smoke checks passed");
