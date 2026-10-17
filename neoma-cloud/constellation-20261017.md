# Karin-Lab constellation reorganization (2026-10-17)

## Verified production result

- D1 owner: `karin-lab`; vault: `Karin-Lab`
- Original snapshot: R2 Revision **21**, 84 Markdown pages
- New snapshot: R2 Revision **22**, 69 Markdown pages
- **14 major/core pages, 55 satellites, 15 semantic merges**
- **24 core-to-core connections**, 55 core-to-satellite connections (79 unique undirected edges / 158 explicit bidirectional wikilinks).
- Every satellite links to exactly one core. Each core also links to its satellites.
- No dangling wikilinks; D1 note index at revision 22.
- Explicit immutable backup: `cloud/graph-backups/pre-constellation-revision-21.json.gz` (original 84 pages).
- Both R2 revision 21 and 22 remain in `neoma_cloud_versions`.

## The 14 core pages

1. `Karin-Lab 思想マップ` (network navigation)
2. `有限の時間を惜しまず使う`
3. `でも本当にそう`
4. `人が主体のAI協働`
5. `AIには作業場を与える`
6. `初心者の入口を狭くしない`
7. `知識は囲い込まない`
8. `自分専用でも十分価値がある`
9. `実機の結果が教師`
10. `捨てる前に役割を変える`
11. `家庭の実験室`
12. `小さな不確実性と遊ぶ`
13. `草の根BBSの精神`
14. `買物日記・生活費も単位を揃えて考える`

## Semantic merges

The full original pages are preserved in the Revision 21 snapshot. Unique prose and any source URLs from each merged page were appended to the target page under **統合した視点（元ノートの記録）**.

| Absorbed title | Retained destination |
| --- | --- |
| AIの答えも疑う | でも本当にそう |
| 検証で思い込みをほどく | 実機の結果が教師 |
| 自分にもできそうを増やす | 初心者の入口を狭くしない |
| AIを見せびらかさない | 初心者の入口を狭くしない |
| 技術の失敗も公開する | 失敗を記録する |
| Qiita・再現条件を丸ごと残す | 失敗を記録する |
| Qiita・最初の一歩を五秒にする | 初心者の入口を狭くしない |
| Qiita・コピペ役を人間から外す | AIには作業場を与える |
| 買物日記・自分の情報圏を疑う | 買物日記・他人の現実は別の地図 |
| 買物日記・値段の逆転から問いを立てる | 買物日記・生活費も単位を揃えて考える |
| 買物日記・広告の性能を自腹で試す | 買物日記・予測と実測のずれを楽しむ |
| プログラムを配る楽しみ | 小さな作者が無数にいる世界 |
| プロンプトを磨き続けない | AIには作業場を与える |
| 買物日記・現場の優先順位は現場で決める | 人が主体のAI協働 |
| 思想マップ・Qiitaと買物日記 | Karin-Lab 思想マップ |

## Cloudflare implementation

One-shot plan in D1 `neoma_graph_plans`:

```sql
SELECT id,status,detail,expected_revision,applied_revision
FROM neoma_graph_plans
WHERE id = 'karin-constellation-20261017-v1';
```

The existing Worker `karin-neoma-cloud` handles the pending migration inside its scheduled maintenance handler. It validates that all original notes have an assigned destination, strips old cross-links, writes the curated topology, checks all resulting wiki links and satellite degrees, creates the R2 backup, writes a new R2 snapshot, and advances the D1 state via compare-and-swap. Only if the snapshot revision is unchanged does it activate the new version and refresh the D1 index.

Do not re-run the plan on a modified vault without generating a new plan from the latest snapshot. To rollback, make a **new** snapshot based on revision 21 rather than editing D1 revision fields alone.
