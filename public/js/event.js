$ = document.querySelector.bind(document)
$$ = document.querySelectorAll.bind(document)
api = 'http://localhost:3000/'

// $$('.nav-link').forEach(element => {
//     element.onclick = function() {
//         console.log('click', $('.nav-link.active'))
//         console.log('this: ', this)
//         // $('.nav-link.active').classList.remove('active')
//         this.classList.add('active')
//     }
// })


document.addEventListener('DOMContentLoaded', function() {
  var buttons = $$('.nav-link'); // Chọn tất cả các nút có class 'button'

  buttons.forEach(function(button) {
    button.addEventListener('click', function() {
        var pageName = button.dataset.page; // Lấy giá trị của thuộc tính 'data-page' của nút
        console.log(button.dataset)
        localStorage.setItem('activePage', pageName); // Lưu giá trị vào localStorage
    });
  });

  // Kiểm tra và áp dụng trạng thái active khi load lại trang
  var activePage = localStorage.getItem('activePage');
  if (activePage) {
    document.querySelector('[data-page="' + activePage + '"]').classList.add('active');
  }
});

// console.log($$('.nav-link'))

// $$('.nav-link').addEventListener('click', function() {
//     console.log("hihihi");
//     this.classList.add('active'); // 'this' ở đây là phần tử .nav-link được click
//     $$('.nav-link.active').forEach(item => item.classList.remove('active'));
// });



$(".checksource-form").addEventListener("submit", function(event) {
    event.preventDefault(); // Ngăn chặn việc submit form mặc định

    $('.loading-form').style.display = 'block';
    $('.checksource-form').style.display = 'none';

    var sourceName = $(".checksource-name").value; // Lấy giá trị từ ô source name
    var sourceEcosystem = $(".checksource-ecosystem").value; // Lấy giá trị của ô source ecosystem
    var sourceVersion = $(".checksource-version").value;
    console.log(sourceName);

    let html = '';
  
    // Kiểm tra xem giá trị có tồn tại và không rỗng
    if (sourceName.trim() !== "" && sourceEcosystem.trim() !== "") {
    // Tạo request hoặc xử lý dữ liệu ở đây (ví dụ sử dụng fetch API)
        fetch('/checksource', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: sourceName, ecosystem: sourceEcosystem , version: sourceVersion }),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Đã gửi dữ liệu:', data);

            html = `<div class="sample-name">Sample name: ${data.name || sourceName}</div>
                <div class="sample-ecosystem">Ecosystem: ${data.ecosystem || sourceEcosystem}</div>
                <div class="sample-version">Version: ${data.version || sourceVersion}</div>
                <div>Commands: ${data.commands}</div>
                <div>Domains: ${data.domains}</div>
                <div>IPs: ${data.ips}</div>
                <h4 class="final-result">The probability of the sample being in benign is: ${data.percentage}</h4>`;
            
            $('.sample-info').innerHTML = html;
            $('.loading-form').style.display = 'none';
            $('.result-form').style.display = 'block';

        })
        .catch(error => {
            console.error('Lỗi khi gửi dữ liệu:', error);
            html = `<div>Source not found!!!</div>`;
            $('.sample-info').innerHTML = html;
            $('.loading-form').style.display = 'none';
            $('.result-form').style.display = 'block';
            
        });
        $('.checksource-name').value = '';
        $('.checksource-ecosystem').value = '';
        $('.checksource-version').value = '';
    } else {
        alert(" Vui lòng nhập thông tin trước.")
    }
});
