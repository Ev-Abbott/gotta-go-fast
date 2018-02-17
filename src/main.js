const speedrunSearchForm = document.getElementById('speedrun-search');
const formContainer = document.getElementById('form-container');
const videoDescription = document.getElementById('video-description');
const videoBox = document.getElementById('video-box');
const input = document.getElementById('time-input');
const baseURL = 'https://www.speedrun.com/api/v1';
const bulkURL = '/games?_bulk=yes&max=1000';
let numberOfRecordsInThousands = 13;
let gameArrayToCheck;
let durationMin;
let durationMax;

speedrunSearchForm.addEventListener('submit', generateRandomSpeedrun);

function generateRandomSpeedrun(e) {
  e.preventDefault();
  const videoDescription = document.createElement('div');
  const timeInput = parseInt(input.value) * 60;
  durationMin = 0;
  durationMax = 0;
  setDurationMinAndMax(timeInput);
  if(input.value.length > 0) {
    $('#loading-modal').modal('show');
    clearVideoDescription();
    clearVideoBox();
    fetchSpeedrunData()
      .then((res) => {
        renderVideoDescription(res);
        renderVideo(res.videos.links[0].uri);
        $('#loading-modal').modal('hide');
      })
      .catch((err) => {
        $('#loading-modal').modal('hide');
        console.log(err);
      });
  }

  input.value = '';
}
function renderVideoDescription(data) {
  const title = document.createElement('h2');
  const subtitle = document.createElement('h4');
  const bio = document.createElement('h4');
  const platform = document.createElement('h4');
  title.textContent = `${data.game_name}`;
  subtitle.textContent = `Category: ${data.category} | Run Time: ${data.run_time}`;
  bio.textContent = `Run by: ${data.players.data[0].names.international} | Date of Run: ${data.date}`;
  platform.textContent = `Game Platform: ${data.platform}`;
  videoDescription.appendChild(title);
  videoDescription.appendChild(subtitle);
  videoDescription.appendChild(bio);
  videoDescription.appendChild(platform);
}
function renderVideo(videoURL) {
  const type = checkURLType(videoURL);
  switch(type) {
    case 'TWITCH':
      renderTwitchVideo(videoURL);
      break;
    case 'YOUTUBE':
      renderYouTubeVideo(videoURL);
      break;
    case 'YOUTUBE_SHORT':
      renderYoutubeShortVideo(videoURL);
      break;
    default:
      videoBox.textContent = 'Unsupported Video Type';
  }
}
function renderTwitchVideo(videoURL) {
    const check = '.tv/videos/';
    const index = videoURL.indexOf(check);
    const videoId = videoURL.slice(index+check.length);
    const iFrame = document.createElement('iframe');
    iFrame.setAttribute('src', `https://player.twitch.tv/?autoplay=false&video=v${videoId}`);
    iFrame.setAttribute('frameborder', 0);
    iFrame.setAttribute('allowfullscreen', true);
    iFrame.setAttribute('scrolling', 'no');
    iFrame.setAttribute('height', 378);
    iFrame.setAttribute('width', 620);
    videoBox.appendChild(iFrame);
  }
function renderYouTubeVideo(videoURL) {
  const check = '.com/watch?v=';
  const index = videoURL.indexOf(check);
  const videoId = videoURL.slice(index+check.length);
  const iFrame = document.createElement('iframe');
  iFrame.setAttribute('src', `https://www.youtube.com/embed/${videoId}`);
  iFrame.setAttribute('frameborder', 0);
  iFrame.setAttribute('allow', 'autoplay; encrypted-media');
  iFrame.setAttribute('allowfullscreen', true);
  iFrame.setAttribute('height', 315);
  iFrame.setAttribute('width', 560);
  videoBox.appendChild(iFrame);
}
function renderYoutubeShortVideo(videoURL) {
  const check = 'tu.be/';
  const index = videoURL.indexOf(check);
  const videoId = videoURL.slice(index+check.length);
  const iFrame = document.createElement('iframe');
  iFrame.setAttribute('src', `https://www.youtube.com/embed/${videoId}`);
  iFrame.setAttribute('frameborder', 0);
  iFrame.setAttribute('allow', 'autoplay; encrypted-media');
  iFrame.setAttribute('allowfullscreen', true);
  iFrame.setAttribute('height', 315);
  iFrame.setAttribute('width', 560);
  videoBox.appendChild(iFrame);
}
function checkURLType(videoURL) {
  const twitchURL = 'https://www.twitch.tv/';
  const youtubeURL = 'https://www.youtube.com/';
  const youtubeShortURL = 'https://youtu.be/';
  const hitboxURL = '';
  const vimeoURL = '';
  const nicoVideoURL = '';
  if (videoURL.includes(twitchURL)) {
    return 'TWITCH';
  } else if (videoURL.includes(youtubeURL)) {
    return 'YOUTUBE';
  } else if (videoURL.includes(youtubeShortURL)){
    return 'YOUTUBE_SHORT';
  }
}
function setDurationMinAndMax(integer) {
  if (integer < 301) {
    durationMin = 0;
    durationMax = integer*1.5;
  } else if (integer < 901) {
    durationMin = integer*0.75;
    durationMax = integer*1.5;
  } else if (integer < 1801) {
    durationMin = integer*0.85;
    durationMax = integer*1.35;
  } else if (integer < 7201) {
    durationMin = integer*0.85;
    durationMax = integer*1.15;
  } else {
    durationMin = integer*0.80;
    durationMax = integer*1.20;
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
  let gameData = array[index];
  array.splice(index, 1);
  return axios.get(`${baseURL}/games/${id}/records?top=1`)
    .then((result) => {
      let successfulSearch = false;
      let data;
      let categoryList = result.data.data;
      categoryList.forEach((category) => {
        let run;
        if (category.runs.length > 0) {
          run = category.runs[0].run;
        }
        if (run) {
          let times = run.times;
          let videos = run.videos;
          let pTime = times.primary_t;
          let convertedTime = toHHMMSS(pTime);
          if (pTime > durationMin-1 && pTime < durationMax+1) {
            if (videos) {
              if(!data) {
                console.log('Success!');
                data = {
                  run_id: run.id,
                  game_id: run.game,
                  category_id: run.category,
                  platform_id: run.system.platform,
                  date: run.date,
                  user: run.players,
                  time: convertedTime,
                  videos: videos
                };
                successfulSearch = true;
              }
            }
          }
        }
      });
      if (successfulSearch) {
        return formatDataProper(data);
      } else if (array.length < 1) {
        return {
          err: 'could not find'
        };
      } else {
        return getRandomGameData(array);
      }
    });
}
function formatDataProper(data) {
  let runInfoToSend = {};
  return axios.get(`${baseURL}/runs/${data.run_id}?embed=players,category,game,platform`)
    .then((res) => {
      const runInfo = res.data.data;
      runInfoToSend.category = runInfo.category.data.name;
      runInfoToSend.game_name = runInfo.game.data.names.international;
      runInfoToSend.platform = runInfo.platform.data.name;
      runInfoToSend.players = runInfo.players;
      runInfoToSend.videos = runInfo.videos;
      runInfoToSend.date = moment(runInfo.date).format('MMMM Do YYYY');
      runInfoToSend.run_time = toHHMMSS(runInfo.times.primary_t);
      return runInfoToSend;
    })
    .catch((err) => {
      console.log(err);
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
function clearVideoBox() {
  while(videoBox.firstChild) {
    videoBox.removeChild(videoBox.firstChild);
  }
}
function clearVideoDescription() {
  while(videoDescription.firstChild) {
    videoDescription.removeChild(videoDescription.firstChild);
  }
}
