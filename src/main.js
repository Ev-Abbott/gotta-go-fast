const speedrunSearchForm = document.getElementById('speedrun-search');
const formContainer = document.getElementById('form-container');
const input = document.getElementById('time-input');
const baseURL = 'https://www.speedrun.com/api/v1';
const bulkURL = '/games?_bulk=yes&max=1000';
let numberOfRecordsInThousands = 13;
let gameArrayToCheck;
let gameData;
let durationMin;
let durationMax;

speedrunSearchForm.addEventListener('submit', generateRandomSpeedrun);

function generateRandomSpeedrun(e) {
  e.preventDefault();
  const videoDescription = document.createElement('div');
  const timeInput = parseInt(input.value) * 60;
  durationMin= 0;
  durationMax = 0;
  setDurationMinAndMax(timeInput);
  if(input.value.length > 0) {
    fetchSpeedrunData()
      .then((res) => {
        // set bullshit
        // append to the doc
        // formContainer.appendChild(videoDescription);
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  input.value = '';
}

function setDurationMinAndMax(integer) {
  if (integer < 301) {
    durationMin = 0;
    durationMax = integer*2;
  } else if (integer < 901) {
    durationMin = integer*0.75;
    durationMax = integer*1.5;
  } else if (integer < 1801) {
    durationMin = integer*0.85;
    durationMax = integer*1.35;
  } else {
    durationMin = integer*0.85;
    durationMax = integer*1.15;
  }
  durationMin = Math.floor(durationMin);
  durationMax = Math.floor(durationMax);
}

function fetchSpeedrunData() {
  let databaseSliceToCheck = getRandomInt(numberOfRecordsInThousands);
  let urlToQuery = `${baseURL}${bulkURL}`;
  let offset = databaseSliceToCheck * 1000;

  if (databaseSliceToCheck === 0) {
    return getDatabaseSlice(urlToQuery);
  } else if (databaseSliceToCheck === 12) {
    return 'This slice has too few records';
  } else {
    urlToQuery += `&offset=${offset}`;
    return getDatabaseSlice(urlToQuery);
  }
}

function getDatabaseSlice(urlToQuery) {
  console.log(urlToQuery);
  return axios.get(urlToQuery)
    .then((response) => {
      gameArrayToCheck = response.data.data;
      return getRandomGameData(gameArrayToCheck);
    })
    .catch((err) => {
      console.log(`ERROR: ${err}`);
    });
}

function getRandomGameData(array) {
  let index = getRandomInt(array.length-1);
  let id = array[index].id;
  gameData = array[index];
  array.splice(index, 1);
  return axios.get(`${baseURL}/games/${id}/records?top=1`)
    .then((result) => {
      let time;
      let categoryList = result.data.data;
      categoryList.forEach((category) => {
        let run;
        if (category.runs.length > 0) {
          run = category.runs[0].run;
        }
        if (run) {
          let times = run.times;
          let pTime = times.primary_t;
          let convertedTime = toHHMMSS(pTime);
          if (pTime > durationMin-1 && pTime < durationMax+1) {
            time = convertedTime;
          }
        }
      });
      if (time) {
        return {
          duration: time,
          game: gameData,
          dataDump: result.data.data
        };
      } else if (array.length < 1) {
        return {
          err: 'could not find'
        };
      } else {
        return getRandomGameData(array);
      }
    });
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function toHHMMSS (secs) {
    var sec_num = parseInt(secs, 10)
    var hours   = Math.floor(sec_num / 3600) % 24
    var minutes = Math.floor(sec_num / 60) % 60
    var seconds = sec_num % 60
    return [hours,minutes,seconds]
        .map(v => v < 10 ? "0" + v : v)
        .filter((v,i) => v !== "00" || i > 0)
        .join(":")
}
