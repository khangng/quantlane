/* Reference text only. It never changes registry settings or EA inputs. */
const FUND_RULES = [
  {
    name:'E8 Signature · Classic', badge:'Bạn: 100k · Challenge',
    sections:[
      ['Đang thi', 'Target 6% = 6.000 USD. EOD drawdown 3.000 USD. Không có Daily Pause ở Challenge. Vẫn phải giữ balance và equity trên sàn EOD trong phiên.'],
      ['Cách sàn EOD tăng', 'Sàn = min(100.000, đỉnh balance cuối ngày − 3.000). Ban đầu 97.000; cuối ngày balance 101.000 → sàn 98.000. Lãi chốt giữa phiên không nâng sàn ngay. Sàn đã tăng không giảm theo ngày lỗ. Giờ chốt trong EA phải khớp server/quỹ.'],
      ['Phiên giao dịch và tin', 'Classic đóng vị thế lúc 23:00 server, mở lại từ 00:15. Được giao dịch tin ở cả hai giai đoạn. Không đồng nghĩa EA tự đóng trước phiên hay bảo đảm khớp giá.'],
      ['Khi lên Performance', 'Daily Pause 2% = 2.000 USD trên 100k; Best Day tối đa 35%. Sau lần payout đầu: cần 5 ngày lời đủ chuẩn giữa các payout, mỗi ngày ít nhất 0,3% = 300 USD. Profile Signature trong bộ này chỉ hỗ trợ Challenge; cần cập nhật trước khi dùng Performance.'],
      ['Payout Classic 100k', 'Giữ buffer 3.000 USD. Trần số tiền yêu cầu: lần 1–2 là 2.250 USD; lần 3–4 là 3.250 USD; từ lần 5 là 4.250 USD. Muốn yêu cầu hết trần cần balance tương ứng 105.250 / 106.250 / 107.250 USD và đủ điều kiện khác. Đây là số yêu cầu trước profit split. Không áp dụng bảng Futures cho Classic.']
    ],
    sources:[['Chương trình Signature','https://help.e8markets.com/en/articles/11755943-e8-signature'],['EOD drawdown','https://help.e8markets.com/en/articles/11864596-eod-dynamic-drawdown'],['Payout cap / buffer','https://help.e8markets.com/en/articles/11940573-payout-caps-and-buffers-for-e8-signature-explained']]
  },
  {
    name:'E8 One · Classic', badge:'Bạn: 200k · Challenge',
    sections:[
      ['Đang thi — đối chiếu gói mua', 'Preset 6% target / 3% daily / 4% dynamic; One cho tùy chỉnh lúc mua. Với preset 200k: target 12.000 USD; ngân sách ngày 6.000 USD; tổng 8.000 USD. Hãy nhập đúng thông số trên đơn mua/dashboard.'],
      ['Daily và Dynamic khác nhau', 'Daily lấy balance đầu ngày trừ số tiền giới hạn cố định theo vốn ban đầu. Dynamic theo đỉnh balance đã chốt, không phải equity và không chờ cuối ngày. Với DD 4%: sàn = min(200.000, đỉnh balance − 8.000). Đỉnh 204.000 → sàn 196.000; đỉnh 208.000 → sàn 200.000. Sàn không lùi xuống sau payout.'],
      ['Khi lên Performance', 'Không có consistency ở Challenge. Performance có Best Day 40%; lợi nhuận cho payout phải vượt 50% ngân sách daily drawdown. Với daily 6.000 USD, mốc này là trên 3.000 USD, còn phải đủ các điều kiện payout khác.'],
      ['Tin và lưu ý', 'Challenge cho giao dịch tin. Performance hạn chế thực thi lệnh trong ±5 phút quanh tin ảnh hưởng cao liên quan, gồm mở/đóng, SL, TP và pending. Không bật cờ payout của Pro cho One. Đối chiếu đỉnh balance khi đổi máy hoặc thiếu lịch sử.']
    ],
    sources:[['Chương trình / gói One','https://help.e8markets.com/en/articles/11775980-e8-one'],['Daily drawdown','https://help.e8markets.com/en/articles/11769446-daily-drawdown'],['Dynamic drawdown','https://intercom.help/e8/en/articles/11782996-dynamic-drawdown']]
  },
  {
    name:'E8 Pro · Classic', badge:'Bạn: 200k · Performance (live)',
    sections:[
      ['Giới hạn hiện tại', 'Daily 2,5% = 5.000 USD theo vốn 200k. Static drawdown 8% = 16.000 USD: sàn ban đầu 184.000 USD trước lần payout đầu. Performance không có target vượt Challenge; nếu mua Pro đang thi, target hiện hành là 8%.'],
      ['Daily profit cap', 'Mỗi ngày chỉ tối đa 2% vốn ban đầu được tính vào target/lợi nhuận: 4.000 USD trên 200k. Phần vượt cap được quỹ gỡ khỏi balance lúc rollover (00:00–01:00 server). Không chia lệnh/hedge để né cap. EA chưa tự kiểm soát cap này; xem dashboard quỹ.'],
      ['Payout', 'Có thể yêu cầu hằng ngày; không có consistency, payout cap hay số ngày giao dịch tối thiểu. Cần lợi nhuận tối thiểu 1% = 2.000 USD giữa các chu kỳ. 50% lợi nhuận là phần có thể yêu cầu, rồi áp dụng profit split; phần còn lại giữ làm buffer.'],
      ['Sau payout đầu — rất quan trọng', 'Sàn tổng được đưa lên vốn ban đầu 200.000 USD. Live không tự chứng minh đã payout. Đối chiếu mốc trên E8 khi yêu cầu payout; cập nhật trạng thái payout/sàn xác nhận trong Quản lý rồi nạp lại .set. Ví dụ equity 203.000, sàn 200.000: dư địa chỉ còn 3.000 USD, không phải 16.000 USD.'],
      ['Tin và cảnh báo', 'Pro cho giao dịch tin cả Challenge lẫn Performance. Slippage vẫn có thể xảy ra. Cảnh báo sau payout dựa trên dư địa tới sàn, với ngưỡng cảnh báo ghi rõ; P&L âm sau rút tiền không tự đồng nghĩa vi phạm drawdown.']
    ],
    sources:[['Chương trình Pro','https://help.e8markets.com/en/articles/15274219-e8-pro'],['Payout Pro','https://help.e8markets.com/en/articles/13653464-payout-request-from-e8-pro'],['Static drawdown','https://help.e8markets.com/en/articles/13653031-static-drawdown'],['Daily profit cap','https://help.e8markets.com/en/articles/15319043-daily-profit-cap']]
  },
  {
    name:'FTMO · Standard 2-Step', badge:'Tham khảo khi mua mới · tài khoản cũ đã tạch',
    sections:[
      ['Hai vòng thi', 'Challenge target 10%; Verification 5%. Mỗi vòng cần ít nhất 4 ngày giao dịch; tính ngày có mở vị thế theo CE(S)T. FTMO Account không có target này hay yêu cầu 4 ngày.'],
      ['Daily và tổng', 'Maximum Daily Loss = 5% vốn ban đầu, tính lại từ balance lúc 00:00 CE(S)T. Maximum Loss = 10% vốn ban đầu, sàn cố định 90% vốn. Equity gồm lời/lỗ mở, swap và commission. Ví dụ 100k: daily 5.000 USD; sàn tổng 90.000 USD. Lãi hôm trước không được dùng để bỏ qua reset daily.'],
      ['Tin trên Standard funded', 'Không thực thi lệnh trong 2 phút trước/sau các sự kiện bị hạn chế trên mã liên quan; gồm SL, TP và pending. Challenge, Verification và Swing được miễn hạn chế này, nhưng vẫn phải tuân thủ chính sách giao dịch. Xem lịch FTMO gắn nhãn Restricted event.'],
      ['Giữ lệnh qua phiên', 'Standard funded phải đóng vị thế trước kỳ nghỉ thị trường dài hơn 2 giờ, gồm cuối tuần khi áp dụng. Challenge, Verification và Swing được miễn hạn chế này. Kiểm tra giờ giao dịch từng mã và ngày lễ.'],
      ['Khi thêm FTMO mới', 'Tạo alias mới, chọn đúng giai đoạn. Profile hiện có là Standard 2-Step. Không dùng cho 1-Step, Instant hoặc Futures: các gói đó có luật khác. Lưu trữ thẻ FTMO đã tạch; không tái sử dụng alias để trộn lịch sử.']
    ],
    sources:[['Trading Objectives','https://ftmo.com/en/trading-objectives/'],['Quy tắc tin','https://ftmo.com/en/faq/can-i-trade-news/'],['Qua đêm / cuối tuần','https://ftmo.com/en/faq/can-i-hold-positions-overnight-or-over-the-weekend/']]
  }
];
function renderFundRules(root){
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  root.innerHTML=FUND_RULES.map(f=>`<article class="panel"><h3>${esc(f.name)}</h3><p class="hint">${esc(f.badge)}</p>${f.sections.map(([title,text])=>`<details open style="margin:14px 0"><summary style="font-weight:700;cursor:pointer">${esc(title)}</summary><p style="line-height:1.65;margin:8px 0">${esc(text)}</p></details>`).join('')}<p class="hint">Nguồn: ${f.sources.map(([t,u])=>`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(t)}</a>`).join(' · ')}</p></article>`).join('')+
  '<aside class="panel" style="grid-column:1/-1"><h3>Lưu ý chung</h3><p style="line-height:1.65">E8 yêu cầu mở và đóng ít nhất một lệnh mỗi 60 ngày. Copy chỉ giữa tài khoản thuộc cùng chủ sở hữu; vẫn phải tuân thủ chính sách hedging, all-or-nothing và giao dịch thiếu trách nhiệm. Xem <a href="https://help.e8markets.com/en/articles/6929927-trading-policies-and-prohibited-trading-strategies" target="_blank" rel="noopener noreferrer">chính sách E8</a>. EA không tự chặn lịch tin, không xác nhận đủ điều kiện payout và không tự đóng theo giờ kết phiên Signature. Mức dừng cá nhân tách biệt với luật quỹ. Rủi ro 1.280 USD là giá trị mở sẵn của bộ tính lot, không thay ngưỡng bảo vệ EA.</p></aside>';
}
