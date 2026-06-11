const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 全局模擬狀態
let currentCustomer = null;
let loginErrorMessage = null;
let registerSuccessMessage = null;
let forgotMessage = null;
let cartItems = []; // 購物車暫存區

// 初始化 SQLite 本地資料庫
const db = new sqlite3.Database('./sugar_code.db', (err) => {
    if (err) console.error("資料庫連接失敗:", err.message);
    else console.log("【糖分密碼】頂級 SQLite 資料庫連線成功！");
});

// 建立資料表
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, nickname TEXT, phone TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS shops (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, area TEXT NOT NULL, address TEXT, status TEXT DEFAULT '尚有空位'
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS desserts (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, price INTEGER NOT NULL, category TEXT NOT NULL, stock INTEGER DEFAULT 10, img_url TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS queue_system (
        shop_id INTEGER PRIMARY KEY, current_number INTEGER DEFAULT 1, last_number INTEGER DEFAULT 5
    )`);
    // 【修改點 2 核心】訂單表結構升級：新增 status 欄位，預設值為 '排單製作中'
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, dessert_name TEXT, sugar_level TEXT, candle TEXT, custom_text TEXT, total_price INTEGER, order_time TEXT, status TEXT DEFAULT '排單製作中'
    )`);

    // 【修改點 4 核心】擴充至 10 款真實甜點商品，隨機網路上搜尋相對應的高清大圖網址，絕不留空
    db.get("SELECT COUNT(*) as count FROM desserts", (err, row) => {
        if (row.count === 0) {
            db.run("INSERT INTO members (username, password, nickname, phone) VALUES ('sugar123', '123456', '昭巧', '0912345678')");
            db.run("INSERT INTO shops (name, area, address, status) VALUES ('糖分密碼-高雄精品總店', '三民區', '高雄市三民區建工路高級商圈', '人潮眾多')");
            db.run("INSERT INTO shops (name, area, address, status) VALUES ('糖分密碼-燕巢奢華分店', '燕巢區', '高雄市燕巢區大學路庭園店', '尚有空位')");
            db.run("INSERT INTO queue_system (shop_id, current_number, last_number) VALUES (1, 14, 22)");
            db.run("INSERT INTO queue_system (shop_id, current_number, last_number) VALUES (2, 3, 5)");

            const stmt = db.prepare("INSERT INTO desserts (name, price, category, stock, img_url) VALUES (?, ?, ?, ?, ?)");
            stmt.run("經典香草千層蛋糕", 280, "千層蛋糕", 12, "/earl_grey.jpeg");
            stmt.run("格雷伯爵茶千層蛋糕", 290, "千層蛋糕", 8, "/vanilla.jpeg");
            stmt.run("法式極品青檸塔", 160, "手工塔類", 15, "https://images.unsplash.com/photo-1519869325930-281384150729?w=800");
            stmt.run("曜石黑金巧克力慕斯", 220, "奢華蛋糕", 6, "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800");
            stmt.run("香頂皇家松露可頌", 95, "精緻麵包", 25, "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800");
            stmt.run("日式靜岡抹茶捲", 180, "精緻蛋糕", 10, "/matcha.jpeg");
            stmt.run("法式蔓越莓司康", 85, "精緻麵包", 20, "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800");
            stmt.run("奢華金箔草莓塔", 210, "手工塔類", 7, "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800");
            stmt.run("義式醇香提拉米蘇", 190, "精緻蛋糕", 14, "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800");
            stmt.run("經典丹麥明太子麵包", 110, "精緻麵包", 18, "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800");
            stmt.finalize();
            console.log("【糖分密碼】10 款精品級烘焙現貨商品大圖載入完成！");
        }
    });
});

// ==================== 【🔒 會員安全核心路由】 ====================
app.get('/login', (req, res) => {
    res.render('login', { error: loginErrorMessage, success: registerSuccessMessage, customer: currentCustomer, cartCount: cartItems.length });
    loginErrorMessage = null; registerSuccessMessage = null;
});

app.post('/login/auth', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM members WHERE username = ?", [username], (err, user) => {
        if (!user || user.password !== password) {
            loginErrorMessage = "❌ 帳號或密碼輸入錯誤！無法登入。";
            res.redirect('/login');
        } else {
            currentCustomer = user;
            res.redirect('/');
        }
    });
});

app.get('/register', (req, res) => { res.render('register', { customer: currentCustomer, cartCount: cartItems.length }); });

app.post('/register/submit', (req, res) => {
    const { username, password, nickname, phone } = req.body;
    db.run("INSERT INTO members (username, password, nickname, phone) VALUES (?, ?, ?, ?)", [username, password, nickname, phone], function(err) {
        if (err) { loginErrorMessage = "❌ 帳號已被使用，請更換其他帳號！"; res.redirect('/login'); }
        else { registerSuccessMessage = "註冊完成！已自動返回登入畫面，請輸入帳號密碼。"; res.redirect('/login'); }
    });
});

app.get('/forgot', (req, res) => { res.render('forgot', { message: forgotMessage, customer: currentCustomer, cartCount: cartItems.length }); forgotMessage = null; });

app.post('/forgot/reset', (req, res) => {
    const { username, phone, newPassword } = req.body;
    db.get("SELECT * FROM members WHERE username = ? AND phone = ?", [username, phone], (err, user) => {
        if (!user) { forgotMessage = "❌ 驗證失敗！帳號與註冊手機號碼不吻合。"; res.redirect('/forgot'); }
        else { db.run("UPDATE members SET password = ? WHERE username = ?", [newPassword, username], () => { registerSuccessMessage = "🔒 密碼重設成功！請使用新密碼進行登入。"; res.redirect('/login'); }); }
    });
});

app.get('/logout', (req, res) => { currentCustomer = null; cartItems = []; res.redirect('/'); });

// ==================== 【🎨 全站功能分支路由 (全面加強 cartCount 同步與紅點連動)】 ====================

app.get('/', (req, res) => {
    db.all("SELECT * FROM desserts LIMIT 3", [], (err, slideDesserts) => {
        // 【修改點 3】確保首頁有將購物車總長度 cartCount 塞入大盤傳遞
        res.render('index', { customer: currentCustomer, slides: slideDesserts, cartCount: cartItems.length });
    });
});

app.get('/shop', (req, res) => {
    db.all("SELECT * FROM desserts", [], (err, dessertList) => {
        res.render('shop', { customer: currentCustomer, desserts: dessertList, cartCount: cartItems.length });
    });
});

app.get('/customize', (req, res) => {
    db.all("SELECT * FROM desserts", [], (err, dessertList) => {
        res.render('customize', { customer: currentCustomer, desserts: dessertList, cartCount: cartItems.length });
    });
});

app.get('/map', (req, res) => {
    const areaFilter = req.query.area || '';
    let query = "SELECT s.*, q.current_number, q.last_number FROM shops s JOIN queue_system q ON s.id = q.shop_id";
    let params = [];
    if (areaFilter) { query += " WHERE s.area = ?"; params.push(areaFilter); }
    db.all(query, params, (err, shopList) => {
        res.render('map', { customer: currentCustomer, shops: shopList, currentArea: areaFilter, cartCount: cartItems.length });
    });
});

app.get('/queue', (req, res) => {
    const shopId = req.query.shopId || 1;
    const myNumber = req.query.myNumber || null;
    db.get("SELECT s.name, q.* FROM queue_system q JOIN shops s ON s.id = q.shop_id WHERE q.shop_id = ?", [shopId], (err, queueData) => {
        db.all("SELECT id, name FROM shops", [], (err, shopList) => {
            res.render('queue', { customer: currentCustomer, queue: queueData, shops: shopList, myNumber: myNumber, cartCount: cartItems.length });
        });
    });
});

app.post('/queue/draw', (req, res) => {
    const { shopId } = req.body;
    db.run("UPDATE queue_system SET last_number = last_number + 1 WHERE shop_id = ?", [shopId], () => {
        db.get("SELECT last_number FROM queue_system WHERE shop_id = ?", [shopId], (err, row) => {
            res.redirect(`/queue?shopId=${shopId}&myNumber=${row.last_number}`);
        });
    });
});

app.get('/cart', (req, res) => {
    let total = cartItems.reduce((sum, item) => sum + item.price, 0);
    res.render('cart', { customer: currentCustomer, cart: cartItems, total, cartCount: cartItems.length });
});

// 🔒【精準新增】現貨加入購物車之未登入安全攔截機制
app.post('/cart/add', (req, res) => {
    if (!currentCustomer) {
        return res.send(`<script>alert('🔒 提示：您目前尚未登入會員！請先登入後方可將精品甜點加入購物車。'); location.href='/login';</script>`);
    }
    const { name, price } = req.body;
    cartItems.push({ name, price: parseInt(price), type: '經典現貨', sugar: '正常配方(100%)', candle: '無', text: '無' });
    res.send(`<script>alert('🛒 成功加入您的專屬購物車！'); location.href='/shop';</script>`);
});

// 🔒【精準新增】客製化配置加入購物車之未登入安全攔截機制
app.post('/cart/add-custom', (req, res) => {
    if (!currentCustomer) {
        return res.send(`<script>alert('🔒 提示：您目前尚未登入會員！請先登入後方可配置客製化購物車。'); location.href='/login';</script>`);
    }
    const { dessertName, price, sugarLevel, candle, customText } = req.body;
    let finalPrice = parseInt(price);
    if (candle.includes('+50')) finalPrice += 50;
    cartItems.push({ name: dessertName, price: finalPrice, type: '高級客製化', sugar: sugarLevel, candle, text: customText || '無' });
    res.send(`<script>alert('⚙️ 客製化配置已成功排入購物車紅點清單！'); location.href='/customize';</script>`);
});

app.get('/cart/clear', (req, res) => { cartItems = []; res.redirect('/cart'); });

app.post('/cart/checkout', (req, res) => {
    if (!currentCustomer) return res.send(`<script>alert('🔒 請先登入會員，方可進行購物結帳！'); location.href='/login';</script>`);
    if (cartItems.length === 0) return res.send(`<script>alert('❌ 您的購物車內尚無任何品項！'); location.href='/shop';</script>`);
    
    let completed = 0;
    cartItems.forEach(item => {
        // 結帳時將初始狀態寫入資料庫為 '排單製作中'
        db.run("INSERT INTO orders (username, dessert_name, sugar_level, candle, custom_text, total_price, order_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, '排單製作中')",
            [currentCustomer.nickname, item.name, item.sugar, item.candle, item.text, item.price, new Date().toLocaleString()],
            () => {
                completed++;
                if (completed === cartItems.length) {
                    cartItems = [];
                    res.send(`<script>alert('✨ 購物車已安全送出結帳！請至訂單查詢追蹤主廚製作進度。'); location.href='/orders';</script>`);
                }
            }
        );
    });
});

app.get('/profile', (req, res) => {
    if (!currentCustomer) return res.redirect('/login');
    res.render('profile', { customer: currentCustomer, cartCount: cartItems.length });
});

app.get('/orders', (req, res) => {
    if (!currentCustomer) return res.redirect('/login');
    db.all("SELECT * FROM orders WHERE username = ? ORDER BY id DESC", [currentCustomer.nickname], (err, historyOrders) => {
        res.render('orders', { customer: currentCustomer, orders: historyOrders || [], cartCount: cartItems.length });
    });
});

// ==================== 【📊 獨立店端管理後台核心邏輯】 ====================
app.get('/admin_portal', (req, res) => {
    db.all("SELECT * FROM desserts", [], (err, dessertList) => {
        db.all("SELECT * FROM orders ORDER BY id DESC", [], (err, orderList) => {
            db.all("SELECT s.name, q.* FROM queue_system q JOIN shops s ON s.id = q.shop_id", [], (err, queueList) => {
                db.get("SELECT SUM(total_price) as total FROM orders", (err, revenue) => {
                    // 【修改點 1 核心】統計狀態為 '排單製作中' 的全新訂單總筆數，傳給前端觸發重整彈窗通知
                    db.get("SELECT COUNT(*) as new_count FROM orders WHERE status = '排單製作中'", (err, newOrders) => {
                        res.render('admin', { 
                            desserts: dessertList, 
                            orders: orderList, 
                            queues: queueList, 
                            totalRevenue: revenue.total || 0,
                            newNotificationCount: newOrders.new_count || 0 // 傳入未處理訂單數
                        });
                    });
                });
            });
        });
    });
});

// 【修改點 2 核心】後端變更訂單狀態的專用路由，修改完後立即返回後台首頁
app.post('/admin/order/update_status', (req, res) => {
    const { orderId, nextStatus } = req.body;
    db.run("UPDATE orders SET status = ? WHERE id = ?", [nextStatus, orderId], (err) => {
        res.redirect('/admin_portal');
    });
});

app.post('/admin/queue/next', (req, res) => {
    db.run("UPDATE queue_system SET current_number = current_number + 1 WHERE shop_id = ?", [req.body.shopId], () => { res.redirect('/admin_portal'); });
});

app.post('/admin/dessert/add', (req, res) => {
    const { name, price, category, stock, img_url } = req.body;
    db.run("INSERT INTO desserts (name, price, category, stock, img_url) VALUES (?, ?, ?, ?, ?)", [name, price, category, stock, img_url || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800"], () => { res.redirect('/admin_portal'); });
});

app.post('/admin/dessert/delete/:id', (req, res) => {
    db.run("DELETE FROM desserts WHERE id = ?", [req.params.id], () => { res.redirect('/admin_portal'); });
});

app.listen(PORT, () => {
    console.log(`🛒 精品顧客前端網站：http://localhost:${PORT}`);
    console.log(`📊 獨立店端管理後台：http://localhost:${PORT}/admin_portal`);
});