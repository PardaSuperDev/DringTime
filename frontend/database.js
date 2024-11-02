const API_SERVER = "http://localhost:5000"

export async function getAlarmsProviders() {
    var providers = await (await fetch(API_SERVER + "/provider_list")).json()
    console.log(providers);
    return providers;
}
async function sendNewAlarms(name, data) {
    await fetch(API_SERVER + "/send_public_alarms", {
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
    var alarmsData = await (await fetch(API_SERVER + "/alarms/" + id)).text();
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

async function createAccount(username, email, password) {
    let response = await fetch(API_SERVER + "/create_account", {
        method: "POST",
        body: JSON.stringify({
            "username": username,
            "email": email,
            "password": password
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        }
      });
      const message = await response.json();
      return [!("error" in message) ? 0 : 1, message];
}

async function checkVerifiedEmail(token) {
    let response = await (await fetch(API_SERVER + "/is_email_validated/" + token)).text();
    
    return response;
}

async function connectAccount(username, password) {
    let response = await fetch(API_SERVER + "/connect_account", {
        method: "POST",
        body: JSON.stringify({
            "username": username,
            "password": password
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        }
      });
      const message = await response.text();
      return [message === "Ok" ? 0 : 1, message];
}

window.getAlarmsList = getAlarmsList;
window.getAlarmsProviders = getAlarmsProviders;
window.sendNewAlarms = sendNewAlarms;
window.createAccount = createAccount;
window.connectAccount = connectAccount;
window.checkVerifiedEmail = checkVerifiedEmail;
