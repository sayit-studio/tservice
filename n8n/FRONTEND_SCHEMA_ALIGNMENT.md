# Frontend Schema Alignment - 2026-05-29

- Canonical repo: `C:\dev\tseng-service`.
- Ignore `vote_tool` for this work; it is a temporary requirement.
- Public petition flows now use the current Notion/admin schema.
- Notion `陳情案件主要資料庫` confirmed field baseline:
  - `請託案號` is `title`.
  - Public list/query uses `託辦類別`, `案件區域`, `處理狀況`, `公開摘要`, `回覆內容`, `是否公開`, `改善前圖片`, `改善後圖片`.
- Public case number guidance is ROC date serial format, for example `1150529001`.
- Legal consultation LINE OA member capture remains required for the membership flow; the public LINE OA members workflow export includes CORS response headers.
