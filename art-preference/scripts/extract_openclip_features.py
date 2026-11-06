#!/usr/bin/env python3
"""Deterministic offline OpenCLIP + visible image descriptors for 1,024 CC0 paintings.
Reads the frozen Cloudflare R2 catalog through read-only site endpoints.
Never uses users' answers and never trains during site visits.
"""
import hashlib, io, json, os, time
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import quote
import numpy as np
import requests
import torch
import open_clip
from PIL import Image
from sklearn.decomposition import PCA

BASE=os.environ.get("ART_BASE_URL","https://art.karin-lab.com").rstrip("/")
OUT=os.environ.get("ART_FEATURE_OUTPUT","art-preference/data/features-v1.json")
MODEL="ViT-B-32"
PRETRAINED="openai"
DIM=16
torch.manual_seed(1024)
np.random.seed(1024)
torch.set_num_threads(max(1,min(4,os.cpu_count() or 2)))
session=requests.Session()
def download(item):
    url=BASE+"/img/"+quote(item["id"],safe="")+".jpg"
    for attempt in range(4):
        try:
            r=session.get(url,timeout=30)
            r.raise_for_status()
            binary=r.content
            digest=hashlib.sha256(binary).hexdigest()
            if digest!=item["image_sha256"]:
                raise ValueError(f"SHA mismatch for {item['id']}")
            image=Image.open(io.BytesIO(binary)).convert("RGB")
            image.load()
            return image
        except (requests.RequestException,OSError) as exc:
            if attempt==3: raise
            time.sleep(2*(attempt+1))
def handcrafted(image):
    a=np.asarray(image.resize((80,80)),dtype=np.float32)/255.
    r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
    y=.2126*r+.7152*g+.0722*b
    edges=(np.mean(np.abs(y[1:,:]-y[:-1,:]))+np.mean(np.abs(y[:,1:]-y[:,:-1])))/2
    return np.array([y.mean(),(a.max(2)-a.min(2)).mean(),(r-b).mean(),y.std(),edges,(y<.4).mean()],dtype=np.float32)
resp=session.get(BASE+"/api/catalog",timeout=30)
resp.raise_for_status()
catalog=resp.json()
items=catalog.get("artworks",[])
if len(items)!=1024 or catalog.get("status")!="FROZEN_METADATA_AND_IMAGES":
    raise SystemExit(f"Refusing incomplete/non-frozen catalog, status={catalog.get('status')} count={len(items)}")
if len({a["id"] for a in items})!=1024: raise SystemExit("duplicate IDs")
model,_,transform=open_clip.create_model_and_transforms(MODEL,pretrained=PRETRAINED,device="cpu")
model.eval()
embeddings=[];visual=[]
for idx,item in enumerate(items):
    image=download(item)
    visual.append(handcrafted(image))
    with torch.no_grad():
        out=model.encode_image(transform(image).unsqueeze(0))
        vec=out.float().cpu().numpy()[0]
        vec/=max(1e-9,np.linalg.norm(vec))
        embeddings.append(vec)
    if (idx+1)%50==0: print(f"verified and embedded {idx+1}/1024",flush=True)
raw=np.stack(embeddings).astype(np.float64)
pca=PCA(n_components=DIM,svd_solver="full")
coords=pca.fit_transform(raw)
for j in range(DIM):
    idx=int(np.argmax(np.abs(pca.components_[j])))
    if pca.components_[j,idx]<0: coords[:,j]*=-1
coords=coords/np.maximum(np.std(coords,axis=0),1e-6)
v=np.stack(visual).astype(np.float64)
v=(v-v.mean(axis=0))/np.maximum(v.std(axis=0),1e-6)
joint=np.hstack((.85*coords/np.maximum(np.linalg.norm(coords,axis=1,keepdims=True),1e-9),.15*v/np.maximum(np.linalg.norm(v,axis=1,keepdims=True),1e-9)))
joint=joint/np.maximum(np.linalg.norm(joint,axis=1,keepdims=True),1e-9)
result={"version":"openclip-viT-b32-openai-pca16-v1",
 "status":"FEATURES_FROZEN_UNVALIDATED_RECOMMENDATION",
 "source_catalog_version":catalog["version"],
 "count":1024,
 "embedding_model":MODEL,
 "pretrained":PRETRAINED,
 "algorithm":"OpenCLIP normalized image features; deterministic PCA(16), plus 6 measured visual axes",
 "visual_names":["brightness","saturation","red_blue_balance","contrast","edge_density","dark_pixel_ratio"],
 "validation_notice":"Technical image features only. User preference prediction has NOT been validated.",
 "items":[{"id":item["id"],"image_sha256":item["image_sha256"],"features":[round(float(x),6) for x in joint[i]],"visual":[round(float(x),6) for x in v[i]]} for i,item in enumerate(items)]}
blob=json.dumps(result,ensure_ascii=False,sort_keys=True,separators=(",",":")).encode()
result["sha256_canonical_without_sha256"]=hashlib.sha256(blob).hexdigest()
os.makedirs(os.path.dirname(OUT),exist_ok=True)
with open(OUT,"w",encoding="utf-8") as f:json.dump(result,f,ensure_ascii=False,indent=2);f.write("\n")
print("FEATURES_WRITTEN",OUT,result["sha256_canonical_without_sha256"],flush=True)
