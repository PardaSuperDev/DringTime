const sonneries = [
    ['07:56', '08:01', '08:56', '09:00', '09:55', '10:05', '11:00', '11:04', '11:59', '12:03', '12:58', '13:02', '13:57', '14:01', '14:56', '15:00', '15:55', '16:05', '17:00', '17:04', '17:59'],
    ['07:56', '08:01', '08:56', '09:00', '09:55', '10:05', '11:00', '11:04', '11:59', '12:03', '12:58', '13:02', '13:57', '14:01', '14:56', '15:00', '15:55', '16:05', '17:00', '17:04', '17:59'],
    ['07:56', '08:01', '08:56', '09:00', '09:55', '10:05', '11:00', '11:04', '11:59', '12:03', '12:58', '13:02', '13:57', '14:01', '14:56', '15:00', '15:55', '16:05', '17:00', '17:04', '17:59'],
    ['07:56', '08:01', '08:56', '09:00', '09:55', '10:05', '11:00', '11:04', '11:59', '12:03', '12:58', '13:02', '13:57', '14:01', '14:56', '15:00', '15:55', '16:05', '17:00', '17:04', '17:59'],
    ['07:56', '08:01', '08:56', '09:00', '09:55', '10:05', '11:00', '11:04', '11:59', '12:03', '12:58', '13:02', '13:57', '14:01', '14:56', '15:06', '16:01', '16:05', '17:00', '17:04'],
    [],
    []
];

window.toggled = false;

function toggle_view(type) {
    if (type === "next_alarm") {
        var other_elem = document.getElementById("remaining_time");
    } else if (type === "remaining_time") {
        var other_elem = document.getElementById("next_alarm");
    } else return;

    let settings_icon = document.getElementById("parameter_icon_container");
    
    if (window.toggled){
        other_elem.style = "";
        settings_icon.style = "opacity: 100%";
    } else {
        other_elem.style = "max-height: 0px; opacity: 0%";
        settings_icon.style = "opacity: 0;";
    }
    window.toggled = !window.toggled;
}

function update() {
    let date = new Date();
    let nearest_date = new Date();

    let day = date.getDay();
    let today_alarms = sonneries[day];

    let nearest_date_distance = 99999999.0;


    for (let i=0; i<today_alarms.length; i++) {
        let parts = today_alarms[i].split(":");
        let hours = parseInt(parts[0]);
        let minutes = parseInt(parts[1]);
        nearest_date.setHours(hours);
        nearest_date.setMinutes(minutes);
        let current_dist = nearest_date.getTime()-date.getTime();
        if (current_dist<nearest_date_distance)
        {
            nearest_date_distance = current_dist;
        }
    }


    console.log(nearest_date_distance/1000);
}

setInterval(update, 100);