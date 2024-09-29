
export async function getAlarmsProviders() {
    var providers = await (await fetch("http://127.0.0.1:5000/provider_list")).json()
    console.log(providers);
    return providers;
}
async function sendNewAlarms(name, data) {
    await fetch("http://127.0.0.1:5000/send_public_alarms", {
        method: "POST",
        body: JSON.stringify({
          "test": "a"
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        }
      });
      
}

async function getAlarmsList(id) {
    var alarmsData = await (await fetch("http://127.0.0.1:5000/alarms/" + id)).text();
    console.log(alarmsData);
    var days = alarmsData.split("-");
    var alarms = [];
    days.forEach((item) => {
        let dayAlarms = item.split(";");
        if (dayAlarms.lenght === 0 || dayAlarms[0] == "") {
            alarms.push([]);
        } else alarms.push(dayAlarms[dayAlarms.lenght - 1] === "" ? dayAlarms.slice(0, dayAlarms.lenght - 1) : dayAlarms);
    })
    return alarms;
}

function createAccount(email, password) {
    console.log("Not implemented yet");
}

window.getAlarmsList = getAlarmsList
window.getAlarmsProviders = getAlarmsProviders
window.sendNewAlarms = sendNewAlarms
window.createAccount = createAccount