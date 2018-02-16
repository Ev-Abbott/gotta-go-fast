const speedrunSearchForm = document.getElementById('speedrun-search');
const formContainer = document.getElementById('form-container');
const input = document.getElementById('time-input');
const baseURL = 'https://www.speedrun.com/api/v1';
const bulkURL = '/games?_bulk=yes&max=1000';
let numberOfRecordsInThousands = 13;

speedrunSearchForm.addEventListener('submit', generateRandomSpeedrun);

function generateRandomSpeedrun(e) {
  e.preventDefault();
  const videoDescription = document.createElement('div');
  const timeInput = parseInt(input.value) * 60;
  fetchSpeedrunData();
    // .then((res) => {
    //   // set bullshit
    //   // append to the doc
    //   formContainer.appendChild(videoDescription);
    // });
  input.value = '';
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
  // return axios.get(urlToQuery)
  //   .then((response) => {
  //     let arr = response.data.data;
  //     console.log(arr);
  //   })
  //   .catch((err) => {
  //     console.log(`ERROR: ${err}`);
  //   });
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
