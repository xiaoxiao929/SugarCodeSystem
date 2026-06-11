# 糖分密碼 Sugar Code：甜點智慧零售系統

專案操作流程：
1. 請在您的電腦開啟終端機（Terminal）或 Command Prompt，切換至欲存放的資料夾路徑，並輸入指令下載專案原始碼：
   git clone https://github.com/xiaoxiao929/SugarCodeSystem.git
2. 下載完成後，請輸入指令切換進入專案資料夾：
  cd SugarCodeSystem
3. 請輸入指令一鍵安裝核心依賴套件：
  npm install
4. 請輸入指令啟動後端控制大腦：
  node app.js
5. 在瀏覽器輸入網址進入網站：
  🛒 消費者前端精品網站網址：http://localhost:3000
  📊 店端獨立智慧管理後台網址：http://localhost:3000/admin_portal


網站操作流程影片介紹：https://youtu.be/eGjGq2sHMfk
系統程式碼Github連結：https://github.com/xiaoxiao929/SugarCodeSystem

專案運用技術介紹：
一、 後端核心相依套件與中間件
  本系統的後端核心依賴於 Node.js 生態系中高效、穩定的開源套件，透過 npm 進行套件管理與整合。主要運用套件如下：
  1. Express 框架 (express)
    •	套件定位：後端核心 Web 應用程式框架。
    •	專案實際運用：
      *	負責建立 HTTP 伺服器並監聽特定通訊埠（Port 3000）。
      *	定義全站之路由系統（Routing），包含消費者前端路由（如 /login, /shop, /customize, /queue, /cart）以及店端獨立管理後台路由（/admin_portal）。
      *	實現 RESTful API 設計原則，透過 app.get() 與 app.post() 精準導向對應的控制器邏輯。
  2. SQLite3 資料庫驅動 (sqlite3)
    •	套件定位：非同步、非伺服器型的輕量級關聯式資料庫嵌入式驅動。
    •	專案實際運用：
      *	使用 Database 模組連線並自動建立本地資料庫檔案 sugar_code.db。
      *	利用 db.serialize() 確保資料表（members, shops, desserts, queue_system, orders）依序進行初始化建置（DDL 敘述句）。
      *	利用 db.prepare() 實作參數化查詢語句（Parameterized Queries），在商品初始化（10 款精品烘焙甜點）中進行高效的批次寫入（stmt.run()），並有效防範 SQL 注入攻擊 (SQL Injection)。
  3. Body-Parser 請求解析器 (body-parser)
    •	套件定位：Node.js 請求主體解析中間件。
    •	專案實際運用：
      *	配置 bodyParser.urlencoded({ extended: true })，專責解析前端 HTML 表單（Form）透過 POST 傳遞的網址編碼資料。
      *	使得控制器能透過 req.body 直接解構並讀取使用者輸入之關鍵參數（例如：登入時的 username、客製化時的 sugarLevel、customText 及號碼牌抽取之 shopId）。
  4. Path 內建模組 (path)
    •	套件定位：Node.js 內建之路徑處理工具。
    •	專案實際運用：
      *	搭配 express.static() 中間件，透過 path.join(__dirname, 'public') 將靜態資源目錄（如：甜點實景高畫質大圖、CSS樣式表、前端 JavaScript 腳本）實體路徑進行跨平台安全綁定。
     
二、 前端動態視圖組件與樣板引擎 (View Components & EJS)
  前端並未採用複雜的重型單頁應用（SPA）框架，而是選用與後端整合度最高、渲染效能優異的 EJS 樣板引擎。透過將資料動態注入（Data Injection）HTML 頁面，建構出多個高互動性的「動態組件」：
  1. 全局導覽列組件
    •	運用技術：EJS 條件式渲染。
    •	實際功能：將全局狀態 currentCustomer 與購物車長度 cartCount 注入樣板。
      *	會員狀態防呆：當 customer 為空時，動態顯示「登入/註冊」按鈕；當會員登入成功後，即時切換為顯示會員暱稱（如「昭巧，您好」）與「登出」按鈕。
      *	購物車動態紅點（Notification Badge）：動態接收 cartItems.length。只要購物車內有暫存商品，右上方購物車圖示便會透過 CSS 觸發動態高對比紅點，並即時渲染出當前暫存總件數。
  2. 智慧美食地圖雙欄組件 (Dynamic Dual-Panel Map Component)
    •	運用技術：Vanilla JavaScript DOM 監聽與屬性渲染。
    •	實際功能：
      *	左側面板動態撈取 SQLite 中的門市資料（三民總店、燕巢分店），並依據即時人潮狀態（如：人潮眾多、尚有空位）進行條件式標籤渲染。
      *	右側面板利用純 JavaScript 事件驅動（addEventListener），當顧客點擊左側不同分店卡片時，無需重新整理整個網頁，即時調動前端 DOM 替換右側的高精度地圖路網視圖、中心點定位及門市詳細地址資訊，達成高流暢度的地圖動態同步機制。
  3. 客製化控制項面板
    •	運用技術：HTML5 控制項與後端核心驗證。
    •	實際功能：
      *	透過下拉選單（Select）及核取方塊（Checkbox）建構智慧糖分微調比例（100%、70%、50%、30%）與配件加購組件。
      *	包含開放式單行文本輸入框（TextBox）作為「專屬手工雕刻字功能」，限制輸入長度，並在顧客提交時，自動將客製化參數封裝傳送至後端 /cart/add-custom 路由。

三、 後端核心架構與狀態生命週期管理 (State & Hooks Logic)
  本專案基於後端驅動架構，透過全局狀態管理與特定生命週期攔截，達成了類似前端 Hooks 的動態資料連動效果：
  1. 全局狀態暫存區 
    後端宣告了多個全局變數，作為全站運行時的動態資料中樞：
    •	currentCustomer：鎖定目前登入之會員物件，全站路由皆會以此作為身份校驗依據。
    •	cartItems：購物車暫存陣列。顧客加入的現貨與高級客製化品項，在點擊結帳前皆安全暫存於此陣列中，落實免洗式輕量化設計。
  2. 未登入安全攔截機制 
    •	運作邏輯：等同於路由守衛（Route Guards）或攔截器（Interceptors）。
    •	實際運用：
      *	在 /cart/add、/cart/add-custom 以及 /cart/checkout 等關鍵寫入路由中，第一時間透過 if (!currentCustomer) 進行身份生命週期檢查。
      *	若未通過驗證，後端會立即阻斷程序，並透過動態 Script 跳窗廣播：alert('🔒 提示：您目前尚未登入會員！...')，並強制使用 location.href 將瀏覽器導向登入頁面，從後端架構層面確保資料寫入的安全性。
  3. 後台重整彈窗廣播機制
    •	運作邏輯：自動監聽與動態資料聚合。
    •	實際運用：
      *	當管理者進入或重新整理（F5）獨立店端管理後台（/admin_portal）時，控制器會發動非同步資料庫查詢，特別執行過濾運算：SELECT COUNT(*) as new_count FROM orders WHERE status = '排單製作中'。
      *	一旦發現有未處理的全新訂單（newNotificationCount > 0），前端 EJS 樣板在載入完成的瞬間會立刻被觸發（Hook），主動跳出即時廣播提示跳窗，通知店員有新訂單派達，完美整合了資料庫實時狀態與管理端視覺反饋。
  4. 雲端取號與前方等待人數精算組件
    •	運作邏輯：跨資料表關聯（JOIN）與動態數值演算。
    •	實際運用：
      *	在 /queue 路由中，系統透過 JOIN 語法將 queue_system（排隊序號表）與 shops（門市靜態表）進行即時關聯。
      *	當顧客遠端領取虛擬電子號碼牌（/queue/draw）後，系統在資料庫內將 last_number 累加（+1），並依據 (last_number - current_number) 的核心演算法，在前端動態為該顧客精算出前方正在等待的人數，達成高透明度的雲端取號分流體驗。

四、 總結技術綜效
  本專案透過 Express 路由控制器 的精準分流、Body-Parser 的資料安全解析、SQLite3 的參數化防止注入寫入，結合 EJS 動態組件的紅點通知、未登入攔截守衛、地圖純 JS 同步切換、以及後台未處理訂單之 Hook 廣播機制。各個 Component 與 Package 之間權責分明，相互呼應，成功建構出此套具備高互動性、精品視覺美學與全通路數據連動的甜點智慧零售平台。


