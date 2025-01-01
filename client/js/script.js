const apipath = 'https://bloodsugar-cyan.vercel.app';
const today = new Date();
const animalId = '674d5126c36e4fd631d342c6';

const currentDate = {
    year: today.getFullYear(),
    month: today.getMonth(),
    day: today.getDate(),
    dayInMonth: new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate(),
};

document.addEventListener('DOMContentLoaded', () => {
    updateProfile();
    updateWightChart();
    updateCalendar();
});
async function updateProfile() {
    document.querySelector('#profileCard').innerHTML = '';
    document.querySelector('#profileCard').classList.add('lazyLoading');
    const animalProfile = await getAnimalProfile();
    document.querySelector('#profileCard').classList.remove('lazyLoading');
    const detailBirthday = calculateAgeWithMonths(animalProfile.birthday);
    document.querySelector('#profileCard').innerHTML = `
        <h5 class="text-blue-500 text-lg font-semibold mb-3">基本資料</h5>
        <ul class="list-none grid grid-cols-4 gap-x-4 gap-y-3">
            <li class="text-gray-600 text-sm font-medium">姓名：</li>
            <li class="text-gray-800 text-sm col-span-3">${animalProfile.name}</li>
            <li class="text-gray-600 text-sm font-medium">種類：</li>
            <li class="text-gray-800 text-sm col-span-3"><i class="fa-solid fa-${animalProfile.type}"></i></li>
            <li class="text-gray-600 text-sm font-medium">生日：</li>
            <li class="text-gray-800 text-sm col-span-3">${new Date(animalProfile.birthday).toLocaleDateString()} (${detailBirthday.years}歲 ${detailBirthday.months}個月)</li>
            <li class="text-gray-600 text-sm font-medium">性別：</li>
            <li class="text-gray-800 text-sm col-span-3">${animalProfile.gender === 'Male' ? `<i class="fa-solid fa-mars text-blue-600"></i>` : `<i class="fa-solid fa-venus text-pink-600"></i>`}</li>
            <li class="text-gray-600 text-sm font-medium">血型：</li>
            <li class="text-gray-800 text-sm col-span-3">${animalProfile.bloodType} 型</li>
            <li class="text-gray-600 text-sm font-medium">體重：</li>
            <li class="text-gray-800 text-sm col-span-3">${animalProfile.weight} 公斤</li>
            <li class="text-gray-600 text-sm font-medium">品種：</li>
            <li class="text-gray-800 text-sm col-span-3">${animalProfile.variety}</li>
            <li class="text-gray-600 text-sm font-medium">結紮：</li>
            <li class="text-gray-800 text-sm col-span-3">${animalProfile.ligation ? `<i class="fa-solid fa-check text-green-500"></i>` : `<i class="fa-solid fa-x text-red-500"></i>`}</li>
        </ul>`;
}
async function updateWightChart() {
    const container = document.querySelector('#weightChart');
    container.classList.add('lazyLoading');
    const weight = await getAnimalWeight();
    const datesArray = weight.map((item) => {
        const date = new Date(item.date);
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    });
    const weightArray = weight.map((x) => x.weight);
    const maxWeight = Math.max(...weightArray);
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = '100%';
    canvas.height = '100%';
    container.classList.remove('lazyLoading');
    container.appendChild(canvas);
    const weightChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: datesArray,
            datasets: [
                {
                    label: '體重',
                    data: weightArray,
                    borderColor: 'rgb(147, 197, 253)',
                    backgroundColor: 'rgba(147, 197, 253, 0.6)',
                    tension: 0,
                    pointRadius: 8,
                    pointHoverRadius: 15,
                },
            ],
        },
        plugins: [ChartDataLabels],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `體重走勢圖`,
                },
                legend: {
                    display: false,
                    position: 'top',
                },
                datalabels: {
                    display: true,
                    color: '#0080FF',
                    font: {
                        weight: 'bold',
                        size: 16,
                    },
                    align: 'top',
                    formatter: (value) => value.toFixed(1),
                },
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: '體重(公斤)',
                    },
                    beginAtZero: false,
                    max: maxWeight * 1.01,
                },
            },
        },
    });
}
async function updateCalendar() {
    document.querySelector('#calendarTitle').innerText = `${currentDate.year} 年 ${currentDate.month + 1} 月 血糖表`;
    calendarLazyLoading();
    const cells = await mergeDataToCalendar();
    const windowWidth = window.innerWidth;
    document.querySelector('#calendarGrid').innerHTML = cells
        .map((x) =>
            x.date
                ? `
            <div id="calendar${x.year}-${x.month >= 10 ? x.month : '0' + x.month}-${x.date >= 10 ? x.date : '0' + x.date}" class="${today.getFullYear() === x.year && today.getMonth() + 1 === x.month && today.getDate() === x.date ? 'bg-sky-300' : 'bg-blue-200'} text-blue-900 rounded-md p-2 hover:bg-blue-300 cursor-pointer m-1">
                <div class="font-bold text-xl text-center">${x.date}</div>
				<!-- 早上 -->
				<div class="bg-blue-100 p-2 rounded-md mb-2 hover:bg-blue-200">
					<div class="font-semibold text-blue-900 text-center"><i class="fa-regular fa-sun"></i> ${x.morning.time}</div>
					<div data-type="morningBloodSugar" class="editable p-1 text-sm mt-1 ${bloodSugarBGColor(x.morning.bloodSugar)} border border-gray-300 rounded w-full select-none" onclick="cellClick(event,${x.year},${x.month},${x.date})"><i class="fa-solid fa-droplet w-[14px]"></i> : ${x.morning.bloodSugar ? x.morning.bloodSugar + ' mg/dl' : '--'}</div>
					<div data-type="morningInsulin" class="editable p-1 text-sm mt-1 bg-white border border-gray-300 rounded w-full select-none" onclick="cellClick(event,${x.year},${x.month},${x.date})"><i class="fa-solid fa-syringe"></i> : ${x.morning.insulin === '' ? '--' : x.morning.insulin + '小格'}</div>
				</div>
				<!-- 晚上 -->
				<div class="bg-blue-100 p-2 rounded-md hover:bg-blue-200">
					<div class="font-semibold text-blue-900 text-center"><i class="fa-regular fa-moon"></i> ${x.evening.time}</div>
					<div data-type="eveningBloodSugar" class="editable p-1 text-sm mt-1 ${bloodSugarBGColor(x.evening.bloodSugar)} border border-gray-300 rounded w-full select-none" onclick="cellClick(event,${x.year},${x.month},${x.date})"><i class="fa-solid fa-droplet w-[14px]"></i> : ${x.evening.bloodSugar ? x.evening.bloodSugar + ' mg/dl' : '--'}</div>
					<div data-type="eveningInsulin" class="editable p-1 text-sm mt-1 bg-white border border-gray-300 rounded w-full select-none" onclick="cellClick(event,${x.year},${x.month},${x.date})"><i class="fa-solid fa-syringe"></i> : ${x.evening.insulin === '' ? '--' : x.evening.insulin + '小格'}</div>
				</div>
            </div>`
                : windowWidth >= 1024
                ? '<div class="rounded-md p-2 m-1"></div>'
                : ''
        )
        .join('');
}
async function updateCurrentMonthSugarChart() {
    document.querySelector('#monthChart').innerHTML = `<div class="lazyLoading rounded-lg overflow-hidden shadow-lg bg-white mt-6 p-4 h-[350px] w-full"></div>`;
    const sugarCurve = await getBloodSugarCurve();
    document.querySelector('#monthChart').innerHTML = '';
    sugarCurve.forEach((data, index) => {
        const canvas = document.createElement('canvas');
        canvas.id = `sugarCurvechart-${index}`; // 设置唯一ID
        canvas.width = '100%';
        canvas.height = '100%';
        const div = document.createElement('div');
        div.classList.add('rounded-lg', 'overflow-hidden', 'shadow-lg', 'bg-white', 'mt-6', 'p-4', 'h-[350px]');
        document.querySelector('#monthChart').appendChild(div);
        div.append(canvas);
        const timeArray = data.records.map((x) => x.time);
        const sugarArray = data.records.map((x) => x.value * 1);
        const chartDate = new Date(data.date).toLocaleString().slice(0, 10);
        new Chart(canvas, {
            type: 'line',
            data: {
                labels: timeArray,
                datasets: [
                    {
                        label: '血糖',
                        data: sugarArray,
                        borderColor: '#D2E9FF',
                        backgroundColor: '#D2E9FF',
                        tension: 0,
                        pointRadius: 8,
                        pointHoverRadius: 15,
                    },
                ],
            },
            plugins: [ChartDataLabels],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `${chartDate}血糖曲線`,
                    },
                    legend: {
                        display: false,
                        position: 'top',
                    },
                    datalabels: {
                        display: true,
                        color: '#0080FF',
                        font: {
                            weight: 'bold',
                            size: 16,
                        },
                        align: 'top',
                        formatter: (value) => value.toFixed(1),
                    },
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: '血糖值',
                        },
                        beginAtZero: false,
                        max: Math.max(...sugarArray) * 1.1,
                    },
                },
            },
        });
    });
}
function calculateAgeWithMonths(birthDayString) {
    const today = new Date();
    const birth = new Date(birthDayString);
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    if (months < 0) {
        years--;
        months += 12;
    }
    return { years, months };
}
async function mergeDataToCalendar() {
    const diaryData = await getDiaryData();
    // 創建空物件
    const days = Array.from({ length: currentDate.dayInMonth }, (_, i) => {
        const formattedDate = `${currentDate.year}-${String(currentDate.month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
        const isoDate = new Date(formattedDate).toISOString();
        return {
            year: currentDate.year,
            month: currentDate.month + 1,
            date: i + 1,
            isoDate,
            morning: { time: '', bloodSugar: '', insulin: '' },
            evening: { time: '', bloodSugar: '', insulin: '' },
        };
    });
    console.log('days before merge:', days);
    // 合併資料
    const mergedDays = days.map((day) => {
        const diaryEntry = diaryData.find((entry) => new Date(entry.date).toISOString().split('T')[0] === day.isoDate.split('T')[0]);
        if (diaryEntry) {
            return Object.assign({}, day, {
                morning: {
                    time: diaryEntry.morning.time ?? '',
                    bloodSugar: diaryEntry.morning.bloodSugar ?? '',
                    insulin: diaryEntry.morning.insulin ?? '',
                },
                evening: {
                    time: diaryEntry.evening.time ?? '',

                    bloodSugar: diaryEntry.evening.bloodSugar ?? '',
                    insulin: diaryEntry.evening.insulin ?? '',
                },
            });
        }
        return day; // 沒資料return空物件
    });
    console.log('mergedDays:', mergedDays);
    const firstDay = new Date(currentDate.year, currentDate.month, 1).getDay(); // 第一天星期幾
    const spaceDay = firstDay === 0 ? 6 : firstDay - 1; // 調整成周一第一天
    const blankDays = Array.from({ length: spaceDay }, () => ({ date: null }));
    const allDays = [...blankDays, ...mergedDays];
    const totalCells = 42;
    while (allDays.length < totalCells) {
        allDays.push({ date: null });
    }
    return allDays;
}
function cellClick(e, year, month, date) {
    const target = e.target;
    const cellDate = new Date(`${year}-${month}-${date}`);
    const cellYear = cellDate.getFullYear();
    const cellMonth = (cellDate.getMonth() + 1).toString().padStart(2, '0');
    const day = cellDate.getDate().toString().padStart(2, '0');
    const formattedDate = `${cellYear}-${cellMonth}-${day}`;
    if (target.classList.contains('editable')) {
        const currentValue = target.textContent
            .replace(/^(<i class="fa-solid fa-droplet"><\/i>)| : --/, '')
            .replace(/[^0-9.]+/, '')
            .replace('小格', '')
            .replace(' mg/dl', '');
        if (target.dataset.type.includes('Insulin')) {
            const select = document.createElement('select');
            const options = ['0', '0.5', '1', '1.5', '2'];
            options.forEach((value) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value + '小格';
                if (value === currentValue) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
            select.className = 'p-1 mt-1 border border-blue-500 rounded text-sm w-full';
            target.replaceWith(select);
            select.focus();
            select.addEventListener('blur', async () => {
                // 胰島素select
                target.innerHTML = `<i class="fa-solid fa-syringe"></i>: ${select.value != '請選擇' ? select.value + '小格' : '--'}`;
                select.replaceWith(target);
                if (currentValue == select.value) {
                    return;
                }
                target.classList.add('lazyLoading');
                target.classList.remove('editable');
                if (target.dataset.type.includes('morning')) {
                    await createDiaryData(formattedDate, '', select.value, '', '', '');
                    target.classList.remove('lazyLoading');
                    target.classList.add('editable');
                }
                if (target.dataset.type.includes('evening')) {
                    await createDiaryData(formattedDate, '', '', '', select.value, '');
                    target.classList.remove('lazyLoading');
                    target.classList.add('editable');
                }
            });
            select.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    select.blur();
                }
            });
        } else {
            // 血糖input
            const input = document.createElement('input');
            input.type = 'number';
            input.value = currentValue.replace(' mg/dl', '') === '--' ? '' : currentValue.replace(' mg/dl', '');
            input.className = 'p-1 mt-1 border border-blue-500 rounded text-sm w-full';
            target.replaceWith(input);
            input.focus();

            input.addEventListener('blur', async () => {
                input.replaceWith(target);
                if (currentValue == input.value) {
                    return;
                }
                target.classList.add('lazyLoading');
                target.classList.remove('editable');
                if (target.dataset.type.includes('morning')) {
                    const insertBloodSugarResponse = await createDiaryData(formattedDate, input.value, '', '', '', '');
                    target.classList.remove('bg-white', 'bg-amber-100', 'bg-green-100', 'bg-red-100');
                    target.classList.add(bloodSugarBGColor(insertBloodSugarResponse.morning.bloodSugar), 'aaa');
                    target.innerHTML = `<i class="fa-solid fa-droplet w-[14px]"></i> : ${insertBloodSugarResponse.morning.bloodSugar ? insertBloodSugarResponse.morning.bloodSugar + ' mg/dl' : '--'}`;
                    target.classList.remove('lazyLoading');
                    target.classList.add('editable');
                }
                if (target.dataset.type.includes('evening')) {
                    const insertBloodSugarResponse = await createDiaryData(formattedDate, '', '', input.value, '', '');
                    target.classList.remove('bg-white', 'bg-amber-100', 'bg-green-100', 'bg-red-100');
                    target.classList.add(bloodSugarBGColor(insertBloodSugarResponse.evening.bloodSugar), 'aaa');
                    target.innerHTML = `<i class="fa-solid fa-droplet w-[14px]"></i> : ${insertBloodSugarResponse.evening.bloodSugar ? insertBloodSugarResponse.evening.bloodSugar + ' mg/dl' : '--'}`;
                    target.classList.remove('lazyLoading');
                    target.classList.add('editable');
                }
            });
            input.addEventListener('keydown', function (event) {
                if (event.key === 'Enter') {
                    input.blur();
                }
            });
        }
    }
}
document.querySelector('#prevMonth').addEventListener('click', async () => {
    currentDate.month -= 1;
    if (currentDate.month < 0) {
        currentDate.month = 11;
        currentDate.year -= 1;
    }
    currentDate.dayInMonth = new Date(currentDate.year, currentDate.month + 1, 0).getDate();
    await updateCalendar();
    await updateCurrentMonthSugarChart();
});
document.querySelector('#nextMonth').addEventListener('click', async () => {
    currentDate.month += 1;
    if (currentDate.month > 11) {
        currentDate.month = 0;
        currentDate.year += 1;
    }
    currentDate.dayInMonth = new Date(currentDate.year, currentDate.month + 1, 0).getDate();
    updateCalendar();
    updateCurrentMonthSugarChart();
});
document.querySelector('#addSugarField').addEventListener('click', () => {
    const container = document.querySelector('#sugarCurveinputContainer');
    const newFieldGroup = document.createElement('div');
    newFieldGroup.classList.add('grid', 'grid-cols-[2fr_2fr_0.5fr]', 'gap-4', 'items-center', 'border', 'p-2', 'rounded-md', 'shadow-md');
    newFieldGroup.innerHTML = `
        <input type="time" name="sugarCurveTime" class="block w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300" autocomplete="off"/>
        <input type="number" name="sugarCurveBloodSugar" placeholder="輸入血糖值" class="block w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300" autocomplete="off"/>
        <button class="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded-md">X</button>`;
    container.appendChild(newFieldGroup);
    newFieldGroup.querySelector('button').addEventListener('click', () => {
        newFieldGroup.remove();
    });
});
function openQuickRecordWindow() {
    document.querySelector('#quickRecordSuagr').value = '';
    document.querySelector('#quickRecordInsulin').value = 0;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.querySelector('#quickRecordTime').value = `${hours}:${minutes}`;
    document.querySelector('#quickRecordDate').value = new Date().toISOString().split('T')[0];
    document.querySelector('#quickRecordFade').style.display = 'flex';
}
function openCreateWeightWindow() {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    document.querySelector('#weightDate').value = formattedDate;
    document.querySelector('#weightValue').value = '';
    document.querySelector('#weightFade').style.display = 'flex';
}
function openCreateSugarCurveWindow() {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    document.querySelector('#sugarCurveYear').value = year;
    document.querySelector('#sugarCurveMonth').value = month;
    document.querySelector('#sugarCurveDay').value = day;
    document.querySelector('#sugarCurveBtn').innerHTML = `
        <button class="bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-6 rounded-lg shadow-md w-1/3 transition-all" onclick="document.querySelector('#sugarCurvefade').style.display='none'">取消</button>
        <button class="bg-blue-500 hover:bg-blue-400 text-white py-2 px-6 rounded-lg shadow-md w-1/3 transition-all" onclick="submitSugarCurve(event,'${formattedDate}')">確定</button>`;
    document.querySelector('#sugarCurvefade').style.display = 'flex';
}
async function submitQuickRecord(e) {
    const quickRecordSuagr = document.querySelector('#quickRecordSuagr').value;
    const quickRecordInsulin = document.querySelector('#quickRecordInsulin').value;
    const quickRecordDate = document.querySelector('#quickRecordDate').value;
    const quickRecordTime = document.querySelector('#quickRecordTime').value;
    const quickTime = document.querySelector('input[name=quickTime]:checked')?.value;
    if (!quickRecordSuagr || !quickRecordInsulin || !quickRecordDate || !quickRecordTime || !quickTime) {
        showToast('請輸入完整資訊', 'error');
        return;
    }
    e.target.classList.add('submitLoading');
    e.target.disabled = true;
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    if (quickTime == 'morning') {
        morningBloodSugar = document.querySelector('#quickRecordSuagr').value;
        morningInsulin = document.querySelector('#quickRecordInsulin').value;
        eveningBloodSugar = '';
        eveningInsulin = '';
        morningTime = quickRecordTime;
        eveningTime = '';
    } else if (quickTime == 'evening') {
        morningBloodSugar = '';
        morningInsulin = '';
        eveningBloodSugar = document.querySelector('#quickRecordSuagr').value;
        eveningInsulin = document.querySelector('#quickRecordInsulin').value;
        eveningTime = quickRecordTime;
        morningTime = '';
    }
    const createQuickRecordResponse = await createDiaryData(quickRecordDate, morningBloodSugar, morningInsulin, eveningBloodSugar, eveningInsulin, '', morningTime, eveningTime);
    e.target.classList.remove('submitLoading');
    e.target.disabled = false;
    if (!createQuickRecordResponse?._id) {
        showToast('新增失敗', error);
        return;
    }
    document.querySelector('#quickRecordFade').style.display = 'none';
    document.querySelector(`#calendar${formattedDate}`).innerHTML = '';
    document.querySelector(`#calendar${formattedDate}`).classList.add('lazyLoading');
    document.querySelector(`#calendar${formattedDate}`).classList.remove('cursor-pointer');
    const diaryData = await mergeDataToCalendar();
    const isoDate = new Date(formattedDate).toISOString();
    const todayData = diaryData.find((x) => x.isoDate == isoDate);
    document.querySelector(`#calendar${formattedDate}`).innerHTML = `
        <div class="font-bold text-xl text-center">${todayData.date}</div>
        <!-- 早上 -->
        <div class="bg-blue-100 p-2 rounded-md mb-2 hover:bg-blue-200">
            <div class="font-semibold text-blue-900 text-center"><i class="fa-regular fa-sun"></i> ${todayData.morning.time}</div>
            <div data-type="morningBloodSugar" class="editable p-1 text-sm mt-1 bg-white border border-gray-300 rounded w-full select-none ${bloodSugarBGColor(todayData.morning.bloodSugar)}" onclick="cellClick(event,${todayData.year},${todayData.month},${todayData.date})"><i class="fa-solid fa-droplet w-[14px]"></i> : ${todayData.morning.bloodSugar ? todayData.morning.bloodSugar + ' mg/dl' : '--'}</div>
        <div data-type="morningInsulin" class="editable p-1 text-sm mt-1 bg-white border border-gray-300 rounded w-full select-none" onclick="cellClick(event,${todayData.year},${todayData.month},${todayData.date})"><i class="fa-solid fa-syringe"></i> : ${todayData.morning.insulin === '' ? '--' : todayData.morning.insulin + '小格'}</div>
        </div>
        <!-- 晚上 -->
        <div class="bg-blue-100 p-2 rounded-md mb-2 hover:bg-blue-200">
            <div class="font-semibold text-blue-900 text-center"><i class="fa-regular fa-moon"></i> ${todayData.evening.time}</div>
            <div data-type="eveningBloodSugar" class="editable p-1 text-sm mt-1 bg-white border border-gray-300 rounded w-full select-none ${bloodSugarBGColor(todayData.evening.bloodSugar)}" onclick="cellClick(event,${todayData.year},${todayData.month},${todayData.date})"><i class="fa-solid fa-droplet w-[14px]"></i> : ${todayData.evening.bloodSugar ? todayData.evening.bloodSugar + ' mg/dl' : '--'}</div>
        <div data-type="eveningInsulin" class="editable p-1 text-sm mt-1 bg-white border border-gray-300 rounded w-full select-none" onclick="cellClick(event,${todayData.year},${todayData.month},${todayData.date})"><i class="fa-solid fa-syringe"></i> : ${todayData.evening.insulin === '' ? '--' : todayData.evening.insulin + '小格'}</div>
    </div>`;

    document.querySelector(`#calendar${formattedDate}`).classList.remove('lazyLoading');
    document.querySelector(`#calendar${formattedDate}`).classList.add('cursor-pointer');
}
async function submitWeight(e) {
    const date = document.querySelector('#weightDate').value;
    const weight = document.querySelector('#weightValue').value;
    if (!date || !weight) {
        showToast('請輸入完整資訊', 'error');
        return;
    }
    e.target.classList.add('submitLoading');
    e.target.disabled = true;
    const createWeightResponse = await createWeight(date, weight);
    e.target.classList.remove('submitLoading');
    e.target.disabled = false;
    if (!createWeightResponse._id) {
        showToast('體重新增失敗', 'error');
        return;
    }
    document.querySelector('#weightFade').style.display = 'none';
    updateWightChart();
    if (isToday(date)) {
        updateProfile();
    }
}
async function submitSugarCurve(e, date) {
    let timeArray = [];
    let sugarArray = [];
    const year = document.querySelector('#sugarCurveYear').value;
    const month = document.querySelector('#sugarCurveMonth').value;
    const day = document.querySelector('#sugarCurveDay').value;
    document.querySelectorAll('input[name=sugarCurveTime]').forEach((x) => {
        timeArray.push(x.value);
    });
    document.querySelectorAll('input[name=sugarCurveBloodSugar]').forEach((x) => {
        sugarArray.push(x.value);
    });
    if (!year || !month || !day || timeArray.includes('') || sugarArray.includes('')) {
        showToast('請輸入完整資訊', 'error');
        return;
    }
    e.target.classList.add('submitLoading');
    e.target.disabled = true;
    // 合併資料
    let records = timeArray.map((time, index) => ({
        time,
        value: sugarArray[index],
    }));
    const createSugarCurveResponse = await createSugarCurve(date, records);
    e.target.classList.remove('submitLoading');
    e.target.disabled = false;
    if (!createSugarCurveResponse._id) {
        showToast('新增失敗', 'error');
        return;
    }
    await updateCurrentMonthSugarChart();
    document.querySelector('#sugarCurveinputContainer').innerHTML = `
        <div class="grid grid-cols-[2fr_2fr_0.5fr] gap-4 items-center border p-2 rounded-md shadow-md">
            <input type="time" name="sugarCurveTime" class="block w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <input type="number" name="sugarCurveBloodSugar" placeholder="血糖" class="block w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <button class="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded-md">X</button>
        </div>`;
    document.querySelector('#sugarCurvefade').style.display = 'none';
}
async function getAnimalProfile() {
    try {
        const response = await fetch(`${apipath}/animal/${animalId}`, {
            method: 'GET',
        });
        if (!response.ok) {
            throw new Error(`Request failed with status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        showToast('伺服器忙碌中，請稍後再試。', 'error');
        console.error('getAnimalProfile', error);
        throw error;
    }
}
async function getAnimalWeight() {
    try {
        const response = await fetch(`${apipath}/weight/${animalId}`, {
            method: 'GET',
        });
        if (!response.ok) {
            throw new Error(`Request failed with status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        showToast('伺服器忙碌中，請稍後再試。', 'error');
        console.error('getAnimalWeight', error);
        throw error;
    }
}
async function getDiaryData() {
    try {
        const response = await fetch(`${apipath}/bloodSugar/diary?id=${animalId}&year=${currentDate.year}&month=${currentDate.month + 1}&dayInMonth=${currentDate.dayInMonth}`, {
            method: 'GET',
        });
        if (!response.ok) {
            throw new Error(`Request failed with status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        showToast('伺服器忙碌中，請稍後再試。', 'error');
        console.error('getDiaryData', error);
        throw error;
    }
}
async function getBloodSugarCurve() {
    try {
        const response = await fetch(`${apipath}/bloodSugar/getCurve?userId=${animalId}&year=${currentDate.year}&month=${currentDate.month + 1}`, {
            method: 'GET',
        });
        if (!response.ok) {
            throw new Error(`Request failed with status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        showToast('伺服器忙碌中，請稍後再試。', 'error');
        console.error('getBloodSugarCurve', error);
        throw error;
    }
}
async function createDiaryData(date, morningBloodSugar, morningInsulin, eveningBloodSugar, eveningInsulin, notes, morningTime = '', eveningTime = '') {
    try {
        const response = await fetch(`${apipath}/bloodSugar/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: animalId,
                date,
                morning: {
                    time: morningTime,
                    bloodSugar: morningBloodSugar,
                    insulin: morningInsulin,
                },
                evening: {
                    time: eveningTime,
                    bloodSugar: eveningBloodSugar,
                    insulin: eveningInsulin,
                },
                notes,
            }),
        });
        if (!response.ok) {
            throw new Error(`Request failed with status: ${response.status}`);
        }
        const data = await response.json();
        showToast('新增成功');
        return data;
    } catch (error) {
        showToast('伺服器忙碌中，請稍後再試。', 'error');
        console.error('createDiaryData', error);
        throw error;
    }
}
async function createWeight(date, weight) {
    try {
        const response = await fetch(`${apipath}/weight/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: animalId,
                date,
                weight,
            }),
        });
        if (!response.ok) {
            throw new Error(`Request failed with status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        showToast('伺服器忙碌中，請稍後再試。', 'error');
        console.error('createDiaryData', error);
        throw error;
    }
}
async function createSugarCurve(date, records) {
    try {
        const response = await fetch(`${apipath}/bloodSugar/createCurve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: animalId,
                date,
                records,
            }),
        });
        if (!response.ok) {
            throw new Error(`Request failed with status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        showToast('伺服器忙碌中，請稍後再試。', 'error');
        console.error('createDiaryData', error);
        throw error;
    }
}
function calendarLazyLoading() {
    document.querySelector('#calendarGrid').innerHTML = '';
    for (let i = 0; i < 28; i++) {
        const cell = document.createElement('div');
        cell.classList.add('rounded-md', 'p-2', 'm-1', 'lazyLoading', 'min-h-[268px]', 'max-h-[288px]');
        document.querySelector('#calendarGrid').appendChild(cell);
    }
}
const observer = new IntersectionObserver(
    (entries, observer) => {
        entries.forEach(async (entry) => {
            if (entry.isIntersecting) {
                await updateCurrentMonthSugarChart();
                observer.unobserve(entry.target);
            }
        });
    },
    {
        root: null,
        rootMargin: '0px',
        threshold: 0,
    }
);
const target = document.querySelector('#monthChart');
observer.observe(target);

function isToday(dateString) {
    const inputDate = new Date(dateString); // 將字串轉換成 Date 物件
    const today = new Date();
    return inputDate.getFullYear() === today.getFullYear() && inputDate.getMonth() === today.getMonth() && inputDate.getDate() === today.getDate();
}
// TODO
// 1.快速新增只更新當天卡片

function bloodSugarBGColor(value) {
    if (value === undefined || value === null || value === '') {
        return 'bg-white';
    }
    if (value >= 400) {
        return 'bg-red-100';
    }
    if (value >= 250) {
        return 'bg-amber-100';
    }
    return 'bg-green-100';
}

function showToast(message, type = 'success') {
    const container = document.querySelector('#toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 4000);
}
