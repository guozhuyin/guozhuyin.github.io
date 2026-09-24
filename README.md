# 注音的個人網站

這個 repository 是 [guozhuyin.github.io](https://guozhuyin.github.io/) 的原始碼與 GitHub Pages 發布來源。網站以「注音」作為中文公開名稱，整理面向資訊軟體、系統與 MIS 職務的履歷、作品、研究成果與經歷，也提供 [GitHub](https://github.com/guozhuyin)、[WordPress 部落格](https://zhuyin.epizy.com/) 和社群入口。

## Repository 的用途

GitHub Pages 工作流程會建置網站並發布 `dist/`。這個 repository 保存網站的內容資料、靜態資源、建置程式與產生的頁面；它不是 WordPress 文章資料庫，也不會自動複製 WordPress 全文。

| 路徑 | 用途 |
| --- | --- |
| `content/` | 履歷、作品、經歷、學歷、證照、論文、獎項、文章入口與語言資料 |
| `public/` | 網站使用的原始 CSS、JavaScript、圖示與圖片 |
| `scripts/` | 內容驗證、頁面產生與本機預覽服務 |
| `dist/` | GitHub Pages 發布的建置結果 |
| `editor/` | 僅供本機使用的內容編輯介面，不會作為網站頁面發布 |
| `old/` | 設為 `noindex` 的舊版首頁歷史存檔，與目前網站分開維護 |
| `.github/workflows/pages.yml` | GitHub Pages 的建置與發布設定 |

## 內容來源與資料規則

WordPress 部落格是文章全文與後續更新的來源；`content/articles.json` 保存已整理的文章清單。`featured` 只決定首頁與文章頁顯示的精選篇目，取消精選不會刪除文章。網站不會自動同步 WordPress，文章入口需手動維護。正式的論文題名、作者姓名與證照名稱依原文列示；一般說明才依各語言資料維護。證書與競賽證明圖片預設收合，展開後才查看原圖。

網站目前提供中文、英文及可擴充的語言資料。中文證書優先使用中文圖片，其他語言優先使用英文圖片，沒有英文時回退到中文；這項圖片選擇與網站語言數量分開處理。

## 發布與公開資料邊界

GitHub Actions 會在 `main` 更新時執行 `npm run check`，成功後發布 `dist/`；`dist/` 也保留在 Git 中，供 GitHub Pages 使用。Repository 本身公開，本機內容編輯器的儲存 API 只在本機運作。

只把確認適合公開的內容放入 `content/`、`public/` 或 `dist/`。不要提交身分證件號碼、電話、私人文件或本機檔案路徑；`.private/` 與 `.private-backups/` 是本機資料夾，會被 Git 忽略。

網站以自訂 HTML、CSS 與少量 JavaScript 為主，明暗模式跟隨系統並提供手動切換，頁面保留語意化結構、鍵盤焦點、圖片替代文字與列印樣式。
