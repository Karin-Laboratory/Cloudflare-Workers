import {readFileSync} from "node:fs";import test from "node:test";import assert from "node:assert/strict";
const items=JSON.parse(readFileSync(new URL("../data/preview-artworks.json",import.meta.url),"utf8")).artworks;
test("preview has at least 19 unique paintings to leave recommendations after 8 pairs",()=>{assert.ok(items.length>=19);assert.equal(new Set(items.map(x=>x.id)).size,items.length)});
test("all trial feature vectors are well-formed",()=>{for(const x of items){assert.equal(x.features.length,6);assert.ok(x.features.every(n=>Number.isFinite(n)&&n>=0&&n<=1));assert.ok(x.title&&x.artist&&x.image)}});
test("the preview is not accidentally labeled as official",()=>{const dataset=JSON.parse(readFileSync(new URL("../data/preview-artworks.json",import.meta.url),"utf8"));assert.ok(["UNVERIFIED_PREVIEW_ONLY","MUSEUM_IMAGE_CHECKED_PREVIEW"].includes(dataset.status))});
