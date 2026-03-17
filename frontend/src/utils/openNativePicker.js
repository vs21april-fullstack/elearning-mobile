export const isNativePickerType = (type) =>
    type === "date" ||
    type === "time" ||
    type === "datetime-local" ||
    type === "month" ||
    type === "week";

export const openNativePicker = (event) => {
    const input = event?.currentTarget;
    if (!input || typeof input.showPicker !== "function") return;

    // Open picker when clicking anywhere inside the input field.
    event.preventDefault();
    input.showPicker();
};
