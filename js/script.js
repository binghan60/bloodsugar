const today = new Date();
const currentDate = {
	year: today.getFullYear(),
	month: today.getMonth(),
	day: today.getDate(),
	dayInMonth: new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate(),
};

const spaceDay = () => {
	const firstDay = new Date(currentDate.year, currentDate.month, 1).getDay(); // 得到第一天是星期几
	const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // 调整为周一开始
	return adjustedFirstDay;
};

function calendarCells() {
	const days = Array.from({ length: currentDate.dayInMonth }, (_, i) => ({
		date: i + 1,
		morning: { bloodSugar: '', insulin: '' },
		evening: { bloodSugar: '', insulin: '' },
	}));
	const blankDays = Array.from({ length: spaceDay() }, () => ({ date: null })); // 加入前置空白
	const allDays = [...blankDays, ...days];
	const totalCells = 42; // 确保固定 42 格
	while (allDays.length < totalCells) {
		allDays.push({ date: null }); // 补齐后置空白
	}
	return allDays;
}

function renderCalendar() {
	const calendarGrid = document.getElementById('calendarGrid');
	const currentMonthDisplay = document.getElementById('currentMonth');
	currentMonthDisplay.textContent = `${currentDate.year} 年 ${currentDate.month + 1} 月`;
	calendarGrid.innerHTML = ''; // 清空现有内容
	const cells = calendarCells();
	cells.forEach((cell) => {
		const cellDiv = document.createElement('div');
		cellDiv.classList.add(
			'flex',
			'flex-col',
			'items-center',
			'justify-start',
			'bg-blue-100',
			'text-blue-900',
			'rounded-md',
			'p-2',
			'relative',
			'hover:bg-blue-300',
			'transition-all',
			'duration-200',
			'cursor-pointer',
			'm-1',
			'aspect-square' // 使用 aspect-square 保证每个格子是正方形
		);
		if (cell.date) {
			cellDiv.innerHTML = `
				<div class="font-bold text-xl">${cell.date}</div>
				<!-- 早上 -->
				<div class="flex flex-col w-full bg-blue-50 p-2 rounded-md mb-2">
					<div class="font-semibold text-blue-500">早上</div>
					<div data-type="morningBloodSugar" class="editable p-1 text-sm mt-1 bg-white border border-gray-300 rounded w-full"><i class="fa-solid fa-droplet"></i> : ${cell.morning.bloodSugar || '--'}</div>
					<div data-type="morningInsulin" class="editable p-1 text-sm mt-1 bg-white border border-gray-300 rounded w-full"><i class="fa-solid fa-syringe"></i> : ${cell.morning.insulin || '--'}</div>
				</div>
				<!-- 晚上 -->
				<div class="flex flex-col w-full bg-blue-50 p-2 rounded-md">
					<div class="font-semibold text-blue-500">晚上</div>
					<div data-type="eveningBloodSugar" class="editable p-1 text-sm mt-1 bg-white border border-gray-300 rounded w-full"><i class="fa-solid fa-droplet"></i> : ${cell.evening.bloodSugar || '--'}</div>
					<div data-type="eveningInsulin" class="editable p-1 text-sm mt-1 bg-white border border-gray-300 rounded w-full"><i class="fa-solid fa-syringe"></i> : ${cell.evening.insulin || '--'}</div>
				</div>`;
			calendarGrid.appendChild(cellDiv);

			cellDiv.addEventListener('click', (e) => {
				const target = e.target;
				if (target.classList.contains('editable')) {
					const currentValue = target.textContent.replace(/^(早|晚|<i class="fa-solid fa-droplet"><\/i>|胰): /, '');
					if (target.dataset.type.includes('Insulin')) {
						// 胰島素select
						const select = document.createElement('select');
						const options = ['請選擇', '0', '0.5', '1', '1.5', '2'];
						options.forEach((value) => {
							const option = document.createElement('option');
							option.value = value;
							option.textContent = value + ' 小格';
							if (value === currentValue) {
								option.selected = true;
							}
							select.appendChild(option);
						});
						select.className = 'p-1 mt-1 border border-blue-500 rounded text-sm w-full';
						target.replaceWith(select);
						select.focus();
						select.addEventListener('blur', () => {
							// target.textContent = `胰: ${select.value * 1 || '--'}`;
							console.log(select.value);
							target.innerHTML = `<i class="fa-solid fa-syringe"></i>: ${select.value != '請選擇' ? select.value + '小格' : '--'}`;
							select.replaceWith(target);
							console.log('胰島素Blur');
						});
					} else {
						// 血糖input
						const input = document.createElement('input');
						input.type = 'number';
						input.value = currentValue === '--' ? '' : currentValue;
						input.className = 'p-1 mt-1 border border-blue-500 rounded text-sm w-full';
						target.replaceWith(input);
						input.focus();
						input.addEventListener('blur', () => {
							target.innerHTML = `<i class="fa-solid fa-droplet"></i> : ${input.value || '--'}`;
							input.replaceWith(target);
							console.log('血糖Blur');
						});
					}
				}
			});
		} else {
			// 空白格子
			cellDiv.classList.add('bg-transparent', 'cursor-default', 'pointer-events-none');
			calendarGrid.appendChild(cellDiv);
		}
	});
}

document.getElementById('prevMonth').addEventListener('click', () => {
	currentDate.month -= 1;
	if (currentDate.month < 0) {
		currentDate.month = 11;
		currentDate.year -= 1;
	}
	currentDate.dayInMonth = new Date(currentDate.year, currentDate.month + 1, 0).getDate();
	renderCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
	currentDate.month += 1;
	if (currentDate.month > 11) {
		currentDate.month = 0;
		currentDate.year += 1;
	}
	currentDate.dayInMonth = new Date(currentDate.year, currentDate.month + 1, 0).getDate();
	renderCalendar();
});

renderCalendar();

const ctx = document.querySelector('#weightChart');
const myChart = new Chart(ctx, {
	type: 'line',
	data: {
		labels: ['1月', '2月', '3月', '4月', '5月', '6月'], // X轴标签
		datasets: [
			{
				label: '體重',
				data: [5.6, 6.8, 7.2, 5.9, 6.3, 6.7],
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
		// maintainAspectRatio: false,
		plugins: {
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
				max: 7.5,
			},
		},
	},
});
