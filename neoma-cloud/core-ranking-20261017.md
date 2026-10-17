# Karin-Lab Core Thought Ranking

The 14-node core graph contains one navigation hub `Karin-Lab 思想マップ` and **13 philosophical core nodes**. These are ordered according to how foundational each theme is to the overall philosophy, rather than by graph degree or article views.

| Rank | Renamed main note |
| ---: | --- |
| 1 | 思想１：有限の時間を惜しまず使う |
| 2 | 思想２：でも本当にそう |
| 3 | 思想３：知識は囲い込まない |
| 4 | 思想４：自分専用でも十分価値がある |
| 5 | 思想５：初心者の入口を狭くしない |
| 6 | 思想６：人が主体のAI協働 |
| 7 | 思想７：実機の結果が教師 |
| 8 | 思想８：小さな不確実性と遊ぶ |
| 9 | 思想９：AIには作業場を与える |
| 10 | 思想１０：捨てる前に役割を変える |
| 11 | 思想１１：草の根BBSの精神 |
| 12 | 思想１２：家庭の実験室 |
| 13 | 思想１３：買物日記・生活費も単位を揃えて考える |

Reorganization details:

- Original R2 snapshot: Revision 33; explicit backup `cloud/graph-backups/pre-core-ranking-revision-33.json.gz`.
- Atomic renaming in R2: Revision 34; fullwidth numerals and punctuation in Markdown file names and H1 titles.
- All `[[...]]` references throughout the vault were changed, including core-to-core and satellite-to-core links.
- Open tab paths in cloud snapshot preferences were remapped.
- D1 13-entry metadata repair update queue: `neoma_note_jobs` IDs 4–16. Ensures YAML `title` fields use the ranked names. Validate `status='applied'` for all before declaring metadata complete.
- Original navigation page `Karin-Lab 思想マップ` is deliberately unnumbered; it lists the 13 cores in rank order.
- Expected topology: **69 files, 13 philosophical cores, 1 index hub, 55 satellites**, no dangling links.

Priority is an interpretive, editable ordering, not a measured fact. For a subsequent rerank, generate a new plan and snapshot from the latest R2 state rather than renaming only D1 index entries.
