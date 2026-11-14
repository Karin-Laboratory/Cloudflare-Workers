import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../worker.js", import.meta.url), "utf8");
const encoded = source.match(/const JS=("(?:\\.|[^"\\])*");/);
assert.ok(encoded, "embedded browser script exists");
const client = JSON.parse(encoded[1]);
const start = client.indexOf("function received(e){");
const end = client.indexOf("function connect(){", start);
assert.ok(start >= 0 && end > start, "WebSocket hello handler exists");

function blank(id="local-blank") {
  return { id, text:"", shadow:"", name:"新しいメモ.txt", created:false, dirty:false };
}

function cloud(id) {
  return { id, name:id+".txt", content:"text "+id, revision:1 };
}

function simulateHello(localDocs, cloudDocs, current=localDocs[0]?.id, closedIds=[]) {
  const scheduled = [];
  const ctx = {
    docs: localDocs.map(d => ({ ...d })),
    cloudFiles: new Map(),
    closedTabs: new Set(closedIds),
    current, connected:false, initialized:false, retries:3,
    editor:{ readOnly:true }, composing:false, deferredStates:[],
    remote: x => ({ ...x, text:x.content, shadow:x.content,
                    created:true, dirty:false }),
    fresh: () => blank("replacement-blank"),
    applyTabOrder: () => {},
    show: () => {}, conn: () => {}, msg: () => {},
    backup: () => {}, plan: (d) => scheduled.push(d.id),
    migrate: () => {}, conflict: () => {},
  };
  const received = vm.runInNewContext(client.slice(start,end)+"\nreceived", ctx);
  received({ data:JSON.stringify({ type:"hello", docs:cloudDocs }) });
  return { ...ctx, scheduled };
}

test("new browser starts with exactly one unsaved blank, not all cloud documents", () => {
  const ctx=simulateHello([blank()], [cloud("one"),cloud("two"),cloud("three")]);
  assert.deepEqual(Array.from(ctx.docs,d=>d.id), ["local-blank"]);
  assert.equal(ctx.docs[0].created,false);
  assert.equal(ctx.docs[0].text,"");
  assert.equal(ctx.current,"local-blank");
  assert.equal(ctx.cloudFiles.size,3);
  assert.equal(ctx.connected,true);
  assert.deepEqual(ctx.scheduled,[]);
});

test("returning browser restores only its previously open tabs in the same order", () => {
  const local=[{id:"two",text:"text two",shadow:"text two",created:true,dirty:false},
               {id:"one",text:"text one",shadow:"text one",created:true,dirty:false}];
  const ctx=simulateHello(local, [cloud("one"),cloud("two"),cloud("three")], "two");
  assert.deepEqual(Array.from(ctx.docs,d=>d.id), ["two","one"]);
  assert.equal(ctx.current,"two");
  assert.equal(ctx.cloudFiles.has("three"),true);
});

test("closed cloud tab stays closed after reconnect", () => {
  const ctx=simulateHello(
    [{id:"one",text:"text one",shadow:"text one",created:true,dirty:false}],
    [cloud("one"),cloud("two")], "one", ["two"]);
  assert.deepEqual(Array.from(ctx.docs,d=>d.id), ["one"]);
  assert.equal(ctx.cloudFiles.size,2);
});

test("unsubmitted local draft is kept when server hello arrives", () => {
  const local={id:"draft",text:"an offline note",shadow:"",created:false,dirty:true,name:"メモ.txt"};
  const ctx=simulateHello([local], [cloud("one"),cloud("two")], "draft");
  assert.deepEqual(Array.from(ctx.docs,d=>d.id), ["draft"]);
  assert.equal(ctx.docs[0].text,"an offline note");
  assert.equal(ctx.docs[0].dirty,true);
  assert.deepEqual(ctx.scheduled,["draft"]);
});

test("a browser with no saved open tabs still gets one blank", () => {
  const ctx=simulateHello([], [cloud("one"),cloud("two")]);
  assert.deepEqual(Array.from(ctx.docs,d=>d.id), ["replacement-blank"]);
  assert.equal(ctx.docs[0].created,false);
});
