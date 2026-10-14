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

GitHub Actions 工作流程會在 `main` 更新時執行 `npm run check`，成功後以 `dist/` 作為網站根目錄發布。請在 **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**。2026-10-10 唯讀檢查時，遠端仍是 `main / (root)` 的分支發布；本機程式修改不會自動變更這項設定。操作方式見 [GitHub 官方說明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

`editor/` 與 `content/` 是保留在 repository 中的必要來源資料。建置時會讀取它們，將內容寫入產生的 HTML；發布的 `dist/` 不含這兩個資料夾。正式網站的 `/editor/`、`/editor/index.html`、`/content/` 與 `/content/profile.json` 因此不存在，會回傳 HTTP 404，並顯示根目錄的 `404.html`。本機編輯器使用獨立的本機服務載入資料與儲存 API。

根目錄的 `_config.yml` 另提供 Jekyll 分支發布的排除清單，避免暫時沿用分支發布時把編輯器、內容資料與建置程式當作網站檔案。這個備援設定需要 Jekyll 執行，不能在 repository 根目錄加入 `.nojekyll`；正式發布仍應使用上述 GitHub Actions 設定，才能直接以 `/` 提供首頁、避免 `/dist/` 重複網址。

Repository 本身公開；網站路徑回傳 404 不會限制他人在 GitHub 查看原始資料。請將 `content/` 視為公開內容來源。

只把確認適合公開的內容放入 `content/`、`public/` 或 `dist/`。不要提交身分證件號碼、電話、私人文件或本機檔案路徑；`.private/` 與 `.private-backups/` 是本機資料夾，會被 Git 忽略。

網站以自訂 HTML、CSS 與少量 JavaScript 為主，明暗模式跟隨系統並提供手動切換，頁面保留語意化結構、鍵盤焦點、圖片替代文字與列印樣式。

## 本機編輯與公開預覽

需要 Node.js 18 或以上版本。先執行 `npm run dev`，依顯示的本機網址開啟網站與 `/editor/`。編輯器的明暗切換與網站共用偏好；儲存內容會更新本機頁面，尚未發布至 GitHub。

使用 `npm run preview` 檢查正式網站的路徑行為。這個模式只提供 `dist/`，編輯器與內容來源路徑均回傳 404。需要改用其他本機連接埠時，可設定 `MYPAGE_PORT`。

執行 `npm run check` 會重新建置並驗證內容、內部連結、來源路徑與停用作品網址的 404，以及中英文頁面。請修改 `content/`、`public/` 或建置程式，再建置更新 `dist/`。

## 文案與網址維護

- `profile.fullName` 保存本名，`siteTitle` 控制網站標籤與分享標題，`quoteAttribution` 標示喜歡的引言來源。頁首標誌與分頁圖示共用 `public/assets/favicon.svg`。
- MathAI 與 BioUtopia 只使用 `mathai`、`bioutopia` 這兩個作品代稱。舊的 `ai-math`、`learning-game` 路徑回傳 404。
- `resources[].hidden` 可暫時隱藏其他作品連結，同時保留原始內容；目前 OnClass 作品已隱藏。隱藏資料仍可能在公開 repository 中被讀取，不適合存放私人資料。
- 論文的 `venue` 統一填寫「研討會英文全名（縮寫）」；ICCE、GCCCE、TWELF 的年份另由 `date` 顯示。正式題名與作者維持原文。
- MathAI 頁面的介面截圖位於 `public/uploads/mathai-interface.png`。專案目前沒有公開原始碼或展示連結；若日後開放，請先完成獨立的權限與敏感資料檢查。

## 專案呈現

首頁三個精選專案依同一順序呈現：目標與需求、功能與流程、技術與實作、難點與調整、成果與限制。個人角色獨立列示；各區塊用具體功能、設計取捨和完成狀態說明作品。

BioUtopia 的骨髓場景與翻牌關卡、VR 專案的 Unity 開發畫面取自作者提供的 TWELF 2023 與 GCCCE 2024 論文。論文中的規劃、預期效益及實際完成的成果須分別核對。
