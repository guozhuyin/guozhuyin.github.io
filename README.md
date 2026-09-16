# 注音的個人網站

這是以 GitHub Pages 發布的個人網站。首頁以軟體開發、資訊系統與 MIS 求職內容為主，並連結 WordPress 部落格、GitHub 與其他社群。中文頁面使用公開名稱「注音」，英文頁面使用「Zhuyin」。

## 本機預覽與編輯

請在專案根目錄執行：

```sh
npm run dev
```

需要 Node.js 18 以上。啟動後可開啟：

- 網站預覽：`http://127.0.0.1:4173/`
- 內容編輯器：`http://127.0.0.1:4173/editor/`

編輯器會把內容寫回 `content/`，不會自動發布或推送。完成修改後執行：

```sh
npm run check
```

`npm run check` 會重新產生 `dist/` 並執行測試。GitHub Pages 工作流程只發布 `dist/`；編輯器、來源資料與本機 API 不會部署。

## 維護位置

| 要修改什麼 | 來源檔 |
| --- | --- |
| 名稱、介紹、照片、聯絡方式、技能與興趣 | `content/profile.json` |
| 作品與各作品內容區塊 | `content/projects.json` |
| 教學、活動與工作經歷 | `content/experience.json` |
| 學歷、校系連結與學歷證明 | `content/education.json` |
| 證照與中英文證書 | `content/certificates.json` |
| WordPress 精選文章入口 | `content/articles.json` |
| 研討會論文與摘要 | `content/publications.json` |
| 競賽成果與相關作品 | `content/awards.json` |
| 其他外部作品入口 | `content/resources.json` |
| 語言與備援語言 | `content/languages.json` |
| 導覽、按鈕等固定文字 | `content/interface.json` |

作品的 `blocks` 可增加文字或圖片區塊；圖片上傳後放在 `public/uploads/`。證書、競賽證明與學歷證明在頁面上預設收合，項目名稱就是展開入口。這是版面收納方式，不是存取權限；圖片檔案仍可由知道網址的人開啟。

論文題名、作者與證照正式名稱會保留原文；其他說明可逐一維護不同語言。中文頁的證書優先使用中文圖片，英文及其他語言優先使用英文圖片，缺少時才回退到中文。新增語言只需在 `content/languages.json` 和各內容的語言欄位增加資料。

## 文章來源

WordPress 是文章全文與最新內容的主要來源。GitHub Pages 只維護少量精選入口，因此 WordPress 新增或修改文章後，需在 `content/articles.json` 手動更新標題、摘要、分類、日期與網址；不會假設兩個網站自動同步。尚未有合適內容的分類可以留白，等文章準備好再標記為精選。

## 公開資料與安全

請只把適合公開的內容放入 `content/`、`public/` 或 `dist/`。不要提交身分證件號碼、電話、未公開履歷、私人文件、未處理的照片 EXIF 或含敏感資料的證書。收合元件和 CSS 不能保護檔案內容；需要保留的私人原始檔應放在 Git 儲存庫之外。

`old/index.html` 是舊版入口的簡化存檔，現在網站請從根目錄首頁進入。舊版原始素材不再隨公開網站發布。

## GitHub Pages

推送到 `main` 後，`.github/workflows/pages.yml` 會建置、檢查並發布 `dist/`。在 GitHub 儲存庫設定中將 Pages 的來源設為 GitHub Actions。若使用其他主要分支，請同步修改工作流程中的分支名稱。

## 設計與無障礙

網站使用自訂 HTML、CSS 與少量 JavaScript，採簡約的編輯式作品集排版，不依賴 Material UI 或 Bootstrap 元件。明暗模式預設跟隨系統，按鈕只負責在明亮與暗黑之間切換；再次切回系統模式時會清除手動設定。頁面保留語言標記、鍵盤焦點、跳到主要內容連結、圖片替代文字、語意化標題與列印樣式。`ACCESSIBILITY.md` 記錄目前的檢查項目與限制。
