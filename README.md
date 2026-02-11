# exam-shot

Script Node.js (Windows) de chup trang exam bang Playwright va ghep thanh PDF.

## Yeu cau
- Node.js 18+
- Google Chrome da cai
- Da dang nhap tai khoan tren examice trong profile Chrome dung cho script

## Cai dat
```powershell
npm install
```

## Chay script chinh
```powershell
node capture.js
```

File PDF se duoc tao trong thu muc goc du an (ten mac dinh trong `capture.js`).

## Script mo session (tuy chon)
Dung de mo profile Chrome va kiem tra dang nhap:
```powershell
node save-session-win.js
```

## Luu y
- Chinh `USER_DATA_DIR`, `START`, `END`, `URL` trong `capture.js` theo nhu cau.
- Da ignore cac thu muc khong can thiet: `node_modules/`, `out/`, `chrome-profile/`.
