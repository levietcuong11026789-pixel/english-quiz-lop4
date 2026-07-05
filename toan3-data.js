// ===== Toán Vui 3 — Kho câu hỏi soạn sẵn =====
// Bám SGK Toán 3 — Kết nối tri thức với cuộc sống (GDPT 2018)
// Định dạng: t = chủ đề, q = câu hỏi, o = 4 đáp án, a = chỉ số đáp án đúng (0-3), e = giải thích

const MTOPICS = {
  contru:   { name: "Cộng, trừ trong 100 000", icon: "➕" },
  bangnc:   { name: "Bảng nhân, bảng chia",     icon: "✖️" },
  nhanchia: { name: "Nhân, chia số lớn",        icon: "➗" },
  gapgiam:  { name: "Gấp, giảm & một phần mấy", icon: "🍰" },
  bieuthuc: { name: "Tính giá trị biểu thức",   icon: "🧮" },
  timx:     { name: "Tìm thành phần chưa biết", icon: "❓" },
  sosanh:   { name: "Số đến 100 000",           icon: "🔢" },
  hinhhoc:  { name: "Hình học, chu vi, diện tích", icon: "📐" },
  doluong:  { name: "Đo lường",                 icon: "⚖️" },
  thoigian: { name: "Thời gian, tháng năm",     icon: "🕐" },
  tien:     { name: "Tiền Việt Nam",            icon: "💰" },
  toando:   { name: "Toán đố có lời văn",       icon: "📖" },
};

// ---------- Hình học (soạn sẵn, phần công thức & nhận biết) ----------
const MHINH_BANK = [
  { t: "hinhhoc", q: "Hình vuông có mấy cạnh bằng nhau?", o: ["2 cạnh", "3 cạnh", "4 cạnh", "5 cạnh"], a: 2, e: "Hình vuông có 4 cạnh bằng nhau và 4 góc vuông." },
  { t: "hinhhoc", q: "Hình chữ nhật có mấy góc vuông?", o: ["1", "2", "3", "4"], a: 3, e: "Hình chữ nhật có 4 góc vuông." },
  { t: "hinhhoc", q: "Muốn tính chu vi hình chữ nhật, ta lấy:", o: ["dài + rộng", "(dài + rộng) × 2", "dài × rộng", "dài × 4"], a: 1, e: "Chu vi hình chữ nhật = (chiều dài + chiều rộng) × 2 (cùng đơn vị đo)." },
  { t: "hinhhoc", q: "Muốn tính chu vi hình vuông, ta lấy:", o: ["cạnh × 2", "cạnh × 3", "cạnh × 4", "cạnh + 4"], a: 2, e: "Chu vi hình vuông = độ dài một cạnh × 4." },
  { t: "hinhhoc", q: "Muốn tính diện tích hình chữ nhật, ta lấy:", o: ["dài × rộng", "(dài + rộng) × 2", "dài + rộng", "rộng × 4"], a: 0, e: "Diện tích hình chữ nhật = chiều dài × chiều rộng (cùng đơn vị đo)." },
  { t: "hinhhoc", q: "Muốn tính diện tích hình vuông, ta lấy:", o: ["cạnh × 4", "cạnh × cạnh", "cạnh + cạnh", "cạnh × 2"], a: 1, e: "Diện tích hình vuông = cạnh × cạnh." },
  { t: "hinhhoc", q: "Đơn vị đo diện tích đã học ở lớp 3 là:", o: ["cm", "cm²", "kg", "lít"], a: 1, e: "Diện tích đo bằng xăng-ti-mét vuông, viết tắt là cm²." },
  { t: "hinhhoc", q: "Hình tam giác có mấy cạnh?", o: ["2", "3", "4", "5"], a: 1, e: "Hình tam giác có 3 cạnh, 3 đỉnh, 3 góc." },
  { t: "hinhhoc", q: "Hình tứ giác có mấy đỉnh?", o: ["3", "4", "5", "6"], a: 1, e: "Hình tứ giác có 4 đỉnh và 4 cạnh." },
  { t: "hinhhoc", q: "Dụng cụ nào dùng để kiểm tra góc vuông?", o: ["Thước thẳng", "Ê ke", "Com pa", "Cân"], a: 1, e: "Ê ke là dụng cụ để vẽ và kiểm tra góc vuông." },
  { t: "hinhhoc", q: "Com pa là dụng cụ dùng để:", o: ["vẽ hình tròn", "vẽ hình vuông", "đo cân nặng", "đo nhiệt độ"], a: 0, e: "Com pa dùng để vẽ hình tròn." },
  { t: "hinhhoc", q: "Trong hình tròn, đường kính dài gấp mấy lần bán kính?", o: ["2 lần", "3 lần", "4 lần", "bằng nhau"], a: 0, e: "Đường kính = bán kính × 2, nên đường kính gấp 2 lần bán kính." },
  { t: "hinhhoc", q: "Hình tròn có bán kính 4cm thì đường kính là:", o: ["2cm", "6cm", "8cm", "16cm"], a: 2, e: "Đường kính = bán kính × 2 = 4 × 2 = 8 (cm)." },
  { t: "hinhhoc", q: "Khối lập phương có mấy mặt?", o: ["4 mặt", "5 mặt", "6 mặt", "8 mặt"], a: 2, e: "Khối lập phương có 6 mặt, tất cả đều là hình vuông bằng nhau." },
  { t: "hinhhoc", q: "Các mặt của khối lập phương đều là hình gì?", o: ["Hình tròn", "Hình vuông", "Hình tam giác", "Hình chữ nhật"], a: 1, e: "6 mặt của khối lập phương đều là hình vuông." },
  { t: "hinhhoc", q: "Điểm nằm chính giữa hai đầu đoạn thẳng gọi là gì?", o: ["Trung điểm", "Đỉnh", "Góc", "Bán kính"], a: 0, e: "Trung điểm là điểm ở chính giữa, chia đoạn thẳng thành 2 phần bằng nhau." },
  { t: "hinhhoc", q: "Một hình vuông có chu vi 20cm. Cạnh hình vuông là:", o: ["4cm", "5cm", "10cm", "16cm"], a: 1, e: "Cạnh = chu vi : 4 = 20 : 4 = 5 (cm)." },
  { t: "hinhhoc", q: "Góc nào lớn hơn góc vuông?", o: ["Góc nhọn", "Góc tù", "Góc vuông", "Không có"], a: 1, e: "Góc tù lớn hơn góc vuông; góc nhọn bé hơn góc vuông." },
];

// ---------- Đo lường (soạn sẵn) ----------
const MDOLUONG_BANK = [
  { t: "doluong", q: "1km = ... m. Số cần điền là:", o: ["10", "100", "1000", "10 000"], a: 2, e: "1km = 1000m." },
  { t: "doluong", q: "1m = ... mm. Số cần điền là:", o: ["10", "100", "1000", "10 000"], a: 2, e: "1m = 1000mm." },
  { t: "doluong", q: "1m = ... cm. Số cần điền là:", o: ["10", "100", "1000", "50"], a: 1, e: "1m = 100cm." },
  { t: "doluong", q: "1cm = ... mm. Số cần điền là:", o: ["10", "100", "1000", "5"], a: 0, e: "1cm = 10mm." },
  { t: "doluong", q: "1kg = ... g. Số cần điền là:", o: ["10", "100", "1000", "10 000"], a: 2, e: "1kg = 1000g." },
  { t: "doluong", q: "1 lít = ... ml. Số cần điền là:", o: ["10", "100", "1000", "10 000"], a: 2, e: "1l = 1000ml." },
  { t: "doluong", q: "Nhiệt độ được đo bằng đơn vị nào?", o: ["kg", "độ C (°C)", "ml", "km"], a: 1, e: "Nhiệt độ đo bằng độ C, viết tắt là °C, dùng nhiệt kế để đo." },
  { t: "doluong", q: "Nước đá đang tan có nhiệt độ khoảng:", o: ["0°C", "37°C", "100°C", "50°C"], a: 0, e: "Nước đá đang tan có nhiệt độ 0°C." },
  { t: "doluong", q: "Nước sôi có nhiệt độ khoảng:", o: ["0°C", "37°C", "100°C", "60°C"], a: 2, e: "Nước sôi ở 100°C." },
  { t: "doluong", q: "Nhiệt độ cơ thể người khỏe mạnh khoảng:", o: ["0°C", "25°C", "37°C", "100°C"], a: 2, e: "Cơ thể người khỏe mạnh có nhiệt độ khoảng 37°C." },
  { t: "doluong", q: "Đơn vị nào dùng để đo cân nặng?", o: ["mét", "gam", "lít", "phút"], a: 1, e: "Cân nặng đo bằng gam (g), ki-lô-gam (kg)." },
  { t: "doluong", q: "Đơn vị nào dùng để đo dung tích (nước, sữa...)?", o: ["km", "kg", "ml và l", "cm"], a: 2, e: "Dung tích đo bằng mi-li-lít (ml) và lít (l)." },
  { t: "doluong", q: "Quãng đường từ nhà đến trường dài 2km. Đổi ra mét là:", o: ["20m", "200m", "2000m", "20 000m"], a: 2, e: "1km = 1000m nên 2km = 2000m." },
  { t: "doluong", q: "Một chai nước ngọt chứa 1 lít rưỡi, tức là:", o: ["150ml", "1500ml", "15 000ml", "105ml"], a: 1, e: "1 lít = 1000ml, nửa lít = 500ml. 1000 + 500 = 1500 (ml)." },
  { t: "doluong", q: "Vật nào sau đây nặng khoảng 1kg?", o: ["Một chiếc lá", "Một quả dưa nhỏ", "Một chiếc ô tô", "Một cây bút chì"], a: 1, e: "Quả dưa nhỏ nặng khoảng 1kg. Lá và bút chì nhẹ hơn nhiều, ô tô nặng hơn nhiều." },
  { t: "doluong", q: "5m 3dm = ... dm. Số cần điền là:", o: ["8", "35", "53", "503"], a: 2, e: "5m = 50dm; 50dm + 3dm = 53dm." },
  { t: "doluong", q: "2kg 500g = ... g. Số cần điền là:", o: ["250", "2500", "25 000", "2050"], a: 1, e: "2kg = 2000g; 2000g + 500g = 2500g." },
  { t: "doluong", q: "Đơn vị đo độ dài nào bé nhất trong các đơn vị sau?", o: ["km", "m", "cm", "mm"], a: 3, e: "mm (mi-li-mét) là đơn vị bé nhất: 1cm = 10mm." },
];

// ---------- Thời gian, tháng năm (soạn sẵn) ----------
const MTHOIGIAN_BANK = [
  { t: "thoigian", q: "Một năm có bao nhiêu tháng?", o: ["10 tháng", "11 tháng", "12 tháng", "13 tháng"], a: 2, e: "Một năm có 12 tháng." },
  { t: "thoigian", q: "Một giờ có bao nhiêu phút?", o: ["30 phút", "60 phút", "100 phút", "24 phút"], a: 1, e: "1 giờ = 60 phút." },
  { t: "thoigian", q: "Một phút có bao nhiêu giây?", o: ["30 giây", "60 giây", "100 giây", "12 giây"], a: 1, e: "1 phút = 60 giây." },
  { t: "thoigian", q: "Một ngày có bao nhiêu giờ?", o: ["12 giờ", "20 giờ", "24 giờ", "30 giờ"], a: 2, e: "Một ngày có 24 giờ." },
  { t: "thoigian", q: "Tháng 2 năm thường có bao nhiêu ngày?", o: ["28 ngày", "29 ngày", "30 ngày", "31 ngày"], a: 0, e: "Tháng 2 năm thường có 28 ngày, năm nhuận có 29 ngày." },
  { t: "thoigian", q: "Tháng nào sau đây có 31 ngày?", o: ["Tháng 4", "Tháng 6", "Tháng 9", "Tháng 12"], a: 3, e: "Tháng 12 có 31 ngày. Các tháng 4, 6, 9, 11 có 30 ngày." },
  { t: "thoigian", q: "Tháng nào sau đây có 30 ngày?", o: ["Tháng 1", "Tháng 4", "Tháng 7", "Tháng 8"], a: 1, e: "Tháng 4 có 30 ngày. Các tháng 1, 7, 8 có 31 ngày." },
  { t: "thoigian", q: "15 giờ chiều còn gọi là:", o: ["3 giờ chiều", "5 giờ chiều", "3 giờ sáng", "7 giờ tối"], a: 0, e: "15 giờ = 15 − 12 = 3 giờ chiều." },
  { t: "thoigian", q: "8 giờ tối còn gọi là:", o: ["18 giờ", "19 giờ", "20 giờ", "21 giờ"], a: 2, e: "8 giờ tối = 8 + 12 = 20 giờ." },
  { t: "thoigian", q: "Kim ngắn của đồng hồ chỉ gì?", o: ["Giờ", "Phút", "Giây", "Ngày"], a: 0, e: "Kim ngắn chỉ giờ, kim dài chỉ phút, kim mảnh chạy nhanh chỉ giây." },
  { t: "thoigian", q: "Kim phút quay một vòng hết bao lâu?", o: ["1 phút", "30 phút", "1 giờ", "12 giờ"], a: 2, e: "Kim phút quay đủ một vòng là 60 phút = 1 giờ." },
  { t: "thoigian", q: "\"9 giờ kém 15\" tức là mấy giờ?", o: ["8 giờ 15 phút", "8 giờ 45 phút", "9 giờ 15 phút", "9 giờ 45 phút"], a: 1, e: "9 giờ kém 15 phút nghĩa là còn 15 phút nữa đến 9 giờ, tức 8 giờ 45 phút." },
  { t: "thoigian", q: "Phim bắt đầu lúc 8 giờ, kéo dài 30 phút. Phim kết thúc lúc:", o: ["8 giờ 15", "8 giờ 30", "9 giờ", "9 giờ 30"], a: 1, e: "8 giờ + 30 phút = 8 giờ 30 phút." },
  { t: "thoigian", q: "Hôm nay là thứ Năm. Hai ngày nữa là thứ mấy?", o: ["Thứ Sáu", "Thứ Bảy", "Chủ nhật", "Thứ Hai"], a: 1, e: "Thứ Năm → thứ Sáu (1 ngày) → thứ Bảy (2 ngày)." },
  { t: "thoigian", q: "Một tuần lễ có bao nhiêu ngày?", o: ["5 ngày", "6 ngày", "7 ngày", "8 ngày"], a: 2, e: "Một tuần lễ có 7 ngày." },
  { t: "thoigian", q: "Năm nhuận có bao nhiêu ngày?", o: ["365 ngày", "366 ngày", "364 ngày", "360 ngày"], a: 1, e: "Năm nhuận có 366 ngày (tháng 2 có 29 ngày). Năm thường có 365 ngày." },
];

// ---------- Tiền Việt Nam (soạn sẵn) ----------
const MTIEN_BANK = [
  { t: "tien", q: "Tờ tiền nào có mệnh giá LỚN nhất?", o: ["1000 đồng", "2000 đồng", "5000 đồng", "10 000 đồng"], a: 3, e: "10 000 đồng là mệnh giá lớn nhất trong 4 tờ này." },
  { t: "tien", q: "Hai tờ 5000 đồng đổi được một tờ:", o: ["1000 đồng", "2000 đồng", "10 000 đồng", "50 000 đồng"], a: 2, e: "5000 + 5000 = 10 000 (đồng)." },
  { t: "tien", q: "Năm tờ 2000 đồng có tất cả:", o: ["7000 đồng", "10 000 đồng", "12 000 đồng", "20 000 đồng"], a: 1, e: "2000 × 5 = 10 000 (đồng)." },
  { t: "tien", q: "Tờ 10 000 đồng đổi được mấy tờ 2000 đồng?", o: ["3 tờ", "4 tờ", "5 tờ", "6 tờ"], a: 2, e: "10 000 : 2000 = 5 (tờ)." },
  { t: "tien", q: "Mua bút giá 6000 đồng, đưa cô bán hàng tờ 10 000 đồng. Cô trả lại:", o: ["3000 đồng", "4000 đồng", "5000 đồng", "6000 đồng"], a: 1, e: "10 000 − 6000 = 4000 (đồng)." },
  { t: "tien", q: "Một gói bánh giá 8000 đồng, một hộp sữa giá 7000 đồng. Mua cả hai hết:", o: ["14 000 đồng", "15 000 đồng", "16 000 đồng", "1000 đồng"], a: 1, e: "8000 + 7000 = 15 000 (đồng)." },
  { t: "tien", q: "Em có 20 000 đồng, mua vở hết 12 000 đồng. Em còn lại:", o: ["6000 đồng", "7000 đồng", "8000 đồng", "9000 đồng"], a: 2, e: "20 000 − 12 000 = 8000 (đồng)." },
  { t: "tien", q: "Ba tờ 10 000 đồng và một tờ 5000 đồng là:", o: ["15 000 đồng", "25 000 đồng", "30 000 đồng", "35 000 đồng"], a: 3, e: "10 000 × 3 = 30 000; 30 000 + 5000 = 35 000 (đồng)." },
  { t: "tien", q: "Một quyển truyện giá 25 000 đồng. Mua 2 quyển hết:", o: ["45 000 đồng", "50 000 đồng", "55 000 đồng", "27 000 đồng"], a: 1, e: "25 000 × 2 = 50 000 (đồng)." },
  { t: "tien", q: "Tờ 50 000 đồng đổi được mấy tờ 10 000 đồng?", o: ["4 tờ", "5 tờ", "6 tờ", "10 tờ"], a: 1, e: "50 000 : 10 000 = 5 (tờ)." },
];

// ---------- Toán đố có lời văn (soạn sẵn) ----------
const MTOANDO_BANK = [
  { t: "toando", q: "Mỗi hộp có 6 cái bánh. Hỏi 4 hộp như thế có bao nhiêu cái bánh?", o: ["10 cái", "18 cái", "24 cái", "26 cái"], a: 2, e: "6 × 4 = 24 (cái bánh)." },
  { t: "toando", q: "Có 35 quả cam xếp đều vào 5 đĩa. Hỏi mỗi đĩa có mấy quả cam?", o: ["5 quả", "6 quả", "7 quả", "8 quả"], a: 2, e: "35 : 5 = 7 (quả cam)." },
  { t: "toando", q: "Lớp 3A có 32 học sinh, xếp thành các hàng, mỗi hàng 4 bạn. Hỏi xếp được mấy hàng?", o: ["6 hàng", "7 hàng", "8 hàng", "9 hàng"], a: 2, e: "32 : 4 = 8 (hàng)." },
  { t: "toando", q: "An có 24 viên bi, Bình có nhiều hơn An 8 viên. Hỏi Bình có bao nhiêu viên bi?", o: ["16 viên", "30 viên", "32 viên", "34 viên"], a: 2, e: "\"Nhiều hơn\" thì làm phép cộng: 24 + 8 = 32 (viên bi)." },
  { t: "toando", q: "Mẹ hái được 48 quả táo, chị hái được ít hơn mẹ 15 quả. Hỏi chị hái được bao nhiêu quả?", o: ["33 quả", "34 quả", "35 quả", "63 quả"], a: 0, e: "\"Ít hơn\" thì làm phép trừ: 48 − 15 = 33 (quả)." },
  { t: "toando", q: "Một cửa hàng có 96kg gạo, đã bán 1/3 số gạo đó. Hỏi cửa hàng đã bán bao nhiêu ki-lô-gam gạo?", o: ["23kg", "32kg", "48kg", "64kg"], a: 1, e: "1/3 của 96 là: 96 : 3 = 32 (kg)." },
  { t: "toando", q: "Đàn gà có 8 con, đàn vịt gấp 3 lần đàn gà. Hỏi đàn vịt có bao nhiêu con?", o: ["11 con", "21 con", "24 con", "27 con"], a: 2, e: "\"Gấp 3 lần\" thì làm phép nhân: 8 × 3 = 24 (con vịt)." },
  { t: "toando", q: "Thùng to đựng 36 lít nước, thùng nhỏ đựng số nước giảm 4 lần so với thùng to. Thùng nhỏ đựng:", o: ["9 lít", "32 lít", "40 lít", "12 lít"], a: 0, e: "\"Giảm 4 lần\" thì làm phép chia: 36 : 4 = 9 (lít)." },
  { t: "toando", q: "Một đội trồng cây, ngày đầu trồng 125 cây, ngày sau trồng 138 cây. Cả hai ngày trồng được:", o: ["253 cây", "263 cây", "353 cây", "13 cây"], a: 1, e: "125 + 138 = 263 (cây)." },
  { t: "toando", q: "Cuộn vải dài 81m, cắt đi 27m. Hỏi cuộn vải còn lại bao nhiêu mét?", o: ["44m", "54m", "56m", "64m"], a: 1, e: "81 − 27 = 54 (m)." },
  { t: "toando", q: "Mỗi bàn có 2 học sinh. Hỏi 9 bàn như thế có bao nhiêu học sinh?", o: ["11 học sinh", "16 học sinh", "18 học sinh", "20 học sinh"], a: 2, e: "2 × 9 = 18 (học sinh)." },
  { t: "toando", q: "Có 42 cái kẹo chia đều cho 6 bạn. Hỏi mỗi bạn được mấy cái kẹo?", o: ["6 cái", "7 cái", "8 cái", "9 cái"], a: 1, e: "42 : 6 = 7 (cái kẹo)." },
  { t: "toando", q: "Một xe khách chở 45 người, đến bến có 18 người xuống xe. Hỏi trên xe còn lại bao nhiêu người?", o: ["26 người", "27 người", "28 người", "37 người"], a: 1, e: "45 − 18 = 27 (người)." },
  { t: "toando", q: "Mỗi tuần lễ có 7 ngày. Hỏi 8 tuần lễ có bao nhiêu ngày?", o: ["15 ngày", "48 ngày", "54 ngày", "56 ngày"], a: 3, e: "7 × 8 = 56 (ngày)." },
  { t: "toando", q: "Nhà An nuôi 63 con gà, đã bán đi 1/7 số gà. Hỏi nhà An đã bán mấy con gà?", o: ["7 con", "8 con", "9 con", "56 con"], a: 2, e: "1/7 của 63 là: 63 : 7 = 9 (con gà)." },
  { t: "toando", q: "Một quyển sách dày 128 trang, Hoa đã đọc được một nửa. Hỏi Hoa đã đọc bao nhiêu trang?", o: ["46 trang", "54 trang", "64 trang", "74 trang"], a: 2, e: "Một nửa tức là 1/2: 128 : 2 = 64 (trang)." },
  { t: "toando", q: "Mỗi can đựng 5 lít dầu. Hỏi cần mấy can để đựng hết 40 lít dầu?", o: ["6 can", "7 can", "8 can", "9 can"], a: 2, e: "40 : 5 = 8 (can)." },
  { t: "toando", q: "Khối lớp 3 có 3 lớp, mỗi lớp 35 học sinh. Hỏi khối lớp 3 có tất cả bao nhiêu học sinh?", o: ["95 học sinh", "105 học sinh", "115 học sinh", "38 học sinh"], a: 1, e: "35 × 3 = 105 (học sinh)." },
  { t: "toando", q: "Một sợi dây dài 56cm được cắt thành các đoạn bằng nhau, mỗi đoạn 8cm. Hỏi cắt được mấy đoạn?", o: ["6 đoạn", "7 đoạn", "8 đoạn", "9 đoạn"], a: 1, e: "56 : 8 = 7 (đoạn)." },
  { t: "toando", q: "Túi thứ nhất đựng 18kg gạo, túi thứ hai đựng gấp đôi túi thứ nhất. Hỏi CẢ HAI túi đựng bao nhiêu ki-lô-gam gạo?", o: ["36kg", "44kg", "54kg", "72kg"], a: 2, e: "Túi hai: 18 × 2 = 36 (kg). Cả hai túi: 18 + 36 = 54 (kg)." },
  { t: "toando", q: "Hùng có 15 nhãn vở, Dũng có 21 nhãn vở. Hỏi Dũng có nhiều hơn Hùng mấy nhãn vở?", o: ["5 nhãn vở", "6 nhãn vở", "7 nhãn vở", "36 nhãn vở"], a: 1, e: "21 − 15 = 6 (nhãn vở)." },
  { t: "toando", q: "Một trại nuôi ong thu được 375 lít mật, đã bán 180 lít. Hỏi trại còn lại bao nhiêu lít mật?", o: ["185 lít", "195 lít", "205 lít", "555 lít"], a: 1, e: "375 − 180 = 195 (lít)." },
  { t: "toando", q: "Vườn nhà bà có 5 hàng cau, mỗi hàng 9 cây. Hỏi vườn nhà bà có bao nhiêu cây cau?", o: ["14 cây", "40 cây", "45 cây", "54 cây"], a: 2, e: "9 × 5 = 45 (cây cau)." },
  { t: "toando", q: "Có 72 quyển vở chia đều cho 9 bạn học sinh giỏi. Mỗi bạn nhận được:", o: ["7 quyển", "8 quyển", "9 quyển", "6 quyển"], a: 1, e: "72 : 9 = 8 (quyển vở)." },
  { t: "toando", q: "Anh 12 tuổi, em kém anh 4 tuổi. Hỏi em bao nhiêu tuổi?", o: ["16 tuổi", "8 tuổi", "9 tuổi", "3 tuổi"], a: 1, e: "\"Kém\" nghĩa là ít hơn: 12 − 4 = 8 (tuổi)." },
];

// ---------- Đố vui logic (soạn sẵn) ----------
const MLOGIC_BANK = [
  { t: "logic", q: "An cao hơn Bình. Bình cao hơn Cường. Hỏi ai CAO NHẤT?", o: ["An", "Bình", "Cường", "Không biết được"], a: 0, e: "An cao hơn Bình, Bình lại cao hơn Cường → An cao nhất." },
  { t: "logic", q: "Hoa nhiều kẹo hơn Lan. Mai ít kẹo hơn Lan. Hỏi ai ÍT kẹo nhất?", o: ["Hoa", "Lan", "Mai", "Không biết được"], a: 2, e: "Mai ít hơn Lan, Lan ít hơn Hoa → Mai ít kẹo nhất." },
  { t: "logic", q: "Một con vịt đứng bằng 2 chân nặng 3kg. Hỏi khi nó đứng bằng 1 chân thì nặng bao nhiêu?", o: ["1kg", "1kg rưỡi", "3kg", "6kg"], a: 2, e: "Đứng mấy chân thì cân nặng vẫn không đổi: 3kg. Đây là câu đố mẹo!" },
  { t: "logic", q: "Trong một năm, tháng nào có 28 ngày?", o: ["Chỉ tháng 2", "Tháng 2 và tháng 4", "Không tháng nào", "Tất cả các tháng"], a: 3, e: "Câu đố mẹo: tháng nào cũng có ngày 28, nên tháng nào cũng có (ít nhất) 28 ngày!" },
  { t: "logic", q: "Có 5 cây nến đang cháy, gió thổi tắt 2 cây. Hỏi cuối cùng còn lại mấy cây nến?", o: ["2 cây", "3 cây", "5 cây", "0 cây"], a: 0, e: "3 cây cháy tiếp sẽ cháy hết, chỉ 2 cây bị tắt là còn nguyên. Còn lại 2 cây nến!" },
  { t: "logic", q: "Bố của Nam có 3 người con: Xuân, Hạ và ...?", o: ["Thu", "Đông", "Nam", "Mai"], a: 2, e: "Bố của NAM thì đương nhiên có một người con tên là Nam!" },
  { t: "logic", q: "9999 + 1 bằng bao nhiêu?", o: ["9990", "10 000", "99 991", "10 999"], a: 1, e: "9999 thêm 1 tròn thành 10 000 (mười nghìn)." },
  { t: "logic", q: "Số nào lớn nhất có 3 chữ số?", o: ["100", "900", "990", "999"], a: 3, e: "Số lớn nhất có 3 chữ số là 999." },
  { t: "logic", q: "Số nào bé nhất có 4 chữ số?", o: ["1000", "1111", "9999", "100"], a: 0, e: "Số bé nhất có 4 chữ số là 1000." },
  { t: "logic", q: "Số nào lớn nhất có 3 chữ số KHÁC NHAU?", o: ["999", "987", "978", "998"], a: 1, e: "Chọn 3 chữ số lớn nhất khác nhau 9, 8, 7 và xếp giảm dần: 987." },
  { t: "logic", q: "Hai bố con nhà kia tuổi cộng lại là 40. Bố hơn con 30 tuổi. Hỏi con mấy tuổi?", o: ["5 tuổi", "10 tuổi", "15 tuổi", "20 tuổi"], a: 0, e: "Con = (40 − 30) : 2 = 5 tuổi. (Bố 35, con 5, cộng lại 40, hơn nhau 30.)" },
  { t: "logic", q: "Một chiếc bánh cắt 3 nhát thẳng có thể được NHIỀU NHẤT mấy miếng?", o: ["4 miếng", "5 miếng", "6 miếng", "7 miếng"], a: 3, e: "Nếu 3 nhát cắt khéo léo cắt chéo nhau, được nhiều nhất 7 miếng!" },
  { t: "logic", q: "Gà và thỏ có tất cả 10 cái đầu. Hỏi có bao nhiêu con vật?", o: ["5 con", "10 con", "20 con", "40 con"], a: 1, e: "Mỗi con vật có đúng 1 cái đầu, nên 10 cái đầu = 10 con vật." },
  { t: "logic", q: "Số liền sau của 4599 là:", o: ["4598", "4600", "4500", "5000"], a: 1, e: "Số liền sau hơn 1 đơn vị: 4599 + 1 = 4600." },
  { t: "logic", q: "Số liền trước của 7000 là:", o: ["6099", "6900", "6999", "7001"], a: 2, e: "Số liền trước kém 1 đơn vị: 7000 − 1 = 6999." },
  { t: "logic", q: "Nếu hôm kia là thứ Hai thì ngày mai là thứ mấy?", o: ["Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Ba"], a: 1, e: "Hôm kia là thứ Hai → hôm qua thứ Ba → hôm nay thứ Tư → ngày mai thứ Năm." },
  { t: "logic", q: "Có 6 quả cam chia đều cho 3 bạn, nhưng một bạn không nhận. Hai bạn còn lại chia đều thì mỗi bạn được:", o: ["2 quả", "3 quả", "4 quả", "6 quả"], a: 1, e: "6 quả chia đều cho 2 bạn: 6 : 2 = 3 (quả)." },
  { t: "logic", q: "Một tòa nhà có 5 tầng, mỗi tầng cách nhau 20 bậc thang. Đi từ tầng 1 lên tầng 5 phải leo mấy bậc?", o: ["100 bậc", "80 bậc", "60 bậc", "40 bậc"], a: 1, e: "Từ tầng 1 lên tầng 5 chỉ qua 4 quãng: 20 × 4 = 80 (bậc). Cẩn thận kẻo nhân với 5!" },
  { t: "logic", q: "Tìm số còn thiếu: 1, 1, 2, 3, 5, 8, ...?", o: ["11", "12", "13", "16"], a: 2, e: "Mỗi số bằng tổng hai số liền trước: 5 + 8 = 13. (Dãy Phi-bô-na-xi nổi tiếng!)" },
  { t: "logic", q: "Cái gì càng lấy đi nhiều thì càng to ra?", o: ["Cái bánh", "Cái hố", "Cái kẹo", "Cái cây"], a: 1, e: "Cái hố: càng đào lấy đất đi nhiều thì hố càng to!" },
  { t: "logic", q: "3 con mèo bắt 3 con chuột hết 3 phút. Hỏi 6 con mèo bắt 6 con chuột hết mấy phút?", o: ["3 phút", "6 phút", "9 phút", "12 phút"], a: 0, e: "Mỗi con mèo bắt 1 con chuột hết 3 phút. 6 mèo cùng bắt 6 chuột vẫn chỉ hết 3 phút!" },
  { t: "logic", q: "Một hàng cây có 9 cây, các cây cách đều nhau 2m. Hỏi hàng cây dài bao nhiêu mét?", o: ["18m", "16m", "20m", "11m"], a: 1, e: "9 cây có 8 khoảng cách: 2 × 8 = 16 (m). Số khoảng = số cây − 1." },
  { t: "logic", q: "An xếp các số 5, 2, 8 thành số có 3 chữ số LỚN NHẤT. Số đó là:", o: ["258", "852", "825", "582"], a: 1, e: "Xếp các chữ số từ lớn đến bé: 852." },
  { t: "logic", q: "Tổng của số lớn nhất có 2 chữ số và số bé nhất có 2 chữ số là:", o: ["100", "109", "108", "110"], a: 1, e: "99 + 10 = 109." },
  { t: "logic", q: "Hộp thứ nhất có 4 viên kẹo. Hộp thứ hai có số kẹo gấp đôi hộp thứ nhất. Hộp thứ ba có số kẹo gấp đôi hộp thứ hai. Hộp thứ ba có:", o: ["8 viên", "12 viên", "16 viên", "20 viên"], a: 2, e: "Hộp hai: 4 × 2 = 8. Hộp ba: 8 × 2 = 16 (viên kẹo)." },
];
