const BILLING_MODES = [
  {
    id: 'quarter',
    name: '15分钟制',
    detail: '超过15分钟按半小时',
    unitMinutes: 15,
    minimumMinutes: 15,
  },
  {
    id: 'minute',
    name: '分钟制',
    detail: '实际几分钟算几分钟',
    unitMinutes: 1,
    minimumMinutes: 1,
  },
];

function toDateValue(date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeDateValue(value) {
  const now = new Date();
  const year = clamp(Number(value.year) || now.getFullYear(), now.getFullYear() - 1, now.getFullYear() + 2);
  const month = clamp(Number(value.month) || 1, 1, 12);
  const day = clamp(Number(value.day) || 1, 1, daysInMonth(year, month));
  const hour = clamp(Number(value.hour) || 0, 0, 23);
  const minute = clamp(Number(value.minute) || 0, 0, 59);
  return { year, month, day, hour, minute };
}

function valueToDate(value) {
  const item = normalizeDateValue(value);
  return new Date(item.year, item.month - 1, item.day, item.hour, item.minute);
}

function formatDateTime(value) {
  const item = normalizeDateValue(value);
  return `${item.month}.${item.day} ${String(item.hour).padStart(2, '0')}:${String(item.minute).padStart(2, '0')}`;
}

function formatDuration(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0分钟';
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  if (hour === 0) return `${minute}分钟`;
  if (minute === 0) return `${hour}小时`;
  return `${hour}小时${minute}分钟`;
}

function formatMoney(value) {
  if (!Number.isFinite(value)) return '0';
  return value.toFixed(2).replace(/\.00$/, '');
}

function formatReportHours(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0h';
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : Number(hours.toFixed(2))}h`;
}

function getDuration(startValue, endValue) {
  const start = valueToDate(startValue).getTime();
  const end = valueToDate(endValue).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(Math.ceil((end - start) / 60000), 0);
}

function getBilledMinutes(durationMinutes, modeConfig) {
  if (durationMinutes < modeConfig.minimumMinutes) return 0;
  if (modeConfig.id === 'quarter') {
    const completedHalfHours = Math.floor(durationMinutes / 30) * 30;
    const remainder = durationMinutes % 30;
    return completedHalfHours + (remainder > 15 ? 30 : 0);
  }
  return durationMinutes;
}

function calculateBill({ startAt, endAt, hourlyRate, commission, mode }) {
  const config = BILLING_MODES.find((item) => item.id === mode) || BILLING_MODES[0];
  const durationMinutes = getDuration(startAt, endAt);
  const billedMinutes = getBilledMinutes(durationMinutes, config);
  const rate = Math.max(Number(hourlyRate) || 0, 0);
  const commissionPerHour = Math.max(Number(commission) || 0, 0);
  const gross = (rate / 60) * billedMinutes;
  const commissionAmount = (commissionPerHour / 60) * billedMinutes;

  return {
    config,
    durationMinutes,
    billedMinutes,
    gross,
    commissionAmount,
    net: gross - commissionAmount,
  };
}

Page({
  data: {
    billingModes: BILLING_MODES,
    startAt: toDateValue(new Date()),
    endAt: toDateValue(new Date()),
    hourlyRate: 35,
    commission: 3,
    mode: 'quarter',
    pickerVisible: false,
    pickerTarget: '',
    pickerTitle: '',
    previewVisible: false,
    toastVisible: false,
    toastText: '',
  },

  onLoad() {
    this.recalculate();
  },

  recalculate() {
    const result = calculateBill(this.data);
    const today = new Date();
    const reportText = [
      `日期：${today.getMonth() + 1}.${today.getDate()}`,
      '管理：',
      '类型：',
      '老板 ：',
      '陪玩：',
      `时间 ：${formatReportHours(result.billedMinutes)}`,
      `单价： ${formatMoney(Number(this.data.hourlyRate) || 0)}`,
      `总计：${formatMoney(result.gross)}`,
      `抽成：${formatMoney(result.commissionAmount)}`,
      `到手：${formatMoney(result.net)}`,
      '直属：',
    ].join('\n');

    this.setData({
      startLabel: formatDateTime(this.data.startAt),
      endLabel: formatDateTime(this.data.endAt),
      modeName: result.config.name,
      actualDuration: formatDuration(result.durationMinutes),
      grossText: formatMoney(result.gross),
      commissionText: formatMoney(result.commissionAmount),
      netText: formatMoney(result.net),
      reportText,
      pickerColumns: this.getPickerColumns(),
    });
  },

  getActivePickerValue() {
    return this.data.pickerTarget === 'end' ? this.data.endAt : this.data.startAt;
  },

  getPickerColumns() {
    const value = normalizeDateValue(this.getActivePickerValue ? this.getActivePickerValue() : this.data.startAt);
    return [
      { key: 'year', label: '年', suffix: '年', min: new Date().getFullYear() - 1, max: new Date().getFullYear() + 2, value: value.year, display: String(value.year).padStart(4, '0') },
      { key: 'month', label: '月', suffix: '月', min: 1, max: 12, value: value.month, display: String(value.month).padStart(2, '0') },
      { key: 'day', label: '日', suffix: '日', min: 1, max: daysInMonth(value.year, value.month), value: value.day, display: String(value.day).padStart(2, '0') },
      { key: 'hour', label: '时', suffix: '时', min: 0, max: 23, value: value.hour, display: String(value.hour).padStart(2, '0') },
      { key: 'minute', label: '分', suffix: '分', min: 0, max: 59, value: value.minute, display: String(value.minute).padStart(2, '0') },
    ];
  },

  openStartPicker() {
    this.setData({ pickerVisible: true, pickerTarget: 'start', pickerTitle: '选择开始时间' }, () => {
      this.recalculate();
    });
  },

  openEndPicker() {
    this.setData({ pickerVisible: true, pickerTarget: 'end', pickerTitle: '选择结束时间' }, () => {
      this.recalculate();
    });
  },

  closePicker() {
    this.setData({ pickerVisible: false });
  },

  updatePickerValue(key, nextValue) {
    const columns = this.getPickerColumns();
    const column = columns.find((item) => item.key === key);
    if (!column) return;

    const targetKey = this.data.pickerTarget === 'end' ? 'endAt' : 'startAt';
    const current = normalizeDateValue(this.data[targetKey]);
    const next = normalizeDateValue({
      ...current,
      [key]: clamp(Number(nextValue), column.min, column.max),
    });

    this.setData({ [targetKey]: next }, () => this.recalculate());
  },

  stepPicker(event) {
    const { key, delta } = event.currentTarget.dataset;
    const columns = this.getPickerColumns();
    const column = columns.find((item) => item.key === key);
    if (!column) return;

    let next = Number(column.value) + Number(delta);
    if (next > column.max) next = column.min;
    if (next < column.min) next = column.max;
    this.updatePickerValue(key, next);
  },

  inputPickerValue(event) {
    const { key } = event.currentTarget.dataset;
    this.updatePickerValue(key, event.detail.value);
  },

  onRateInput(event) {
    this.setData({ hourlyRate: event.detail.value }, () => this.recalculate());
  },

  onCommissionInput(event) {
    this.setData({ commission: event.detail.value }, () => this.recalculate());
  },

  selectMode(event) {
    this.setData({ mode: event.currentTarget.dataset.mode }, () => this.recalculate());
  },

  openPreview() {
    this.setData({ previewVisible: true });
  },

  closePreview() {
    this.setData({ previewVisible: false });
  },

  noop() {},

  showCopyToast(text) {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.setData({
      toastVisible: true,
      toastText: text,
    });

    this.toastTimer = setTimeout(() => {
      this.setData({
        toastVisible: false,
        toastText: '',
      });
    }, 1600);
  },

  copyReport() {
    wx.setClipboardData({
      data: this.data.reportText,
      success: () => {
        wx.hideToast();
        this.showCopyToast('生成成功，已复制');
      },
    });
  },
});
