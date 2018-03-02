(function(document, $) {
  const speedrunSearchForm = document.getElementById('speedrun-search');
  const formContainer = document.getElementById('form-container');
  const dropdownContainer = document.getElementById('platform');
  const dropdownMenu = document.getElementById('system-dropdown-menu');
  const dropdownMenuButton = document.getElementById('dropdownMenuButton');
  const checkbox = document.getElementById('platformCheck');
  const videoDescription = document.getElementById('video-description');
  const videoBox = document.getElementById('video-box');
  const input = document.getElementById('time-input');
  const baseURL = 'https://www.speedrun.com/api/v1';
  const bulkURL = '/games?_bulk=yes&max=1000';
  const baseDate = moment("201503", "YYYYMMDD");
  let systemSelected;
  let numberOfMonths = moment().diff(baseDate, 'months');
  /*
    Estimated record count based on speedun.com public
    statistics. Update this if changes are significant.
    RecordCount = 267.4412x + 2760
  */
  let numberOfRecordsInThousands = Math.floor(((267.4412*numberOfMonths+2760)/1000)+1);
  let durationMin;
  let durationMax;
  const systemsToDisplay = ['Android', 'Arcade', 'Dreamcast', 'Game Boy', 'Game Boy Advance',
  'Game Boy Color', 'GameCube', 'iOS', 'Linux', 'Macintosh', 'MS-DOS', 'New Nintendo 3DS', 'Nintendo 3DS',
  'Nintendo 64', 'Nintendo DS', 'Nintendo Entertainment System', 'PC', 'PlayStation',
  'PlayStation 2', 'PlayStation 3', 'PlayStation 4', 'PlayStation Portable', 'PlayStation Vita',
  'Sega Genesis', 'Sega Saturn', 'Super Nintendo', 'Switch', 'Web', 'Wii', 'Wii U', 'Xbox', 'Xbox 360', 'Xbox One'];

  systemsToDisplay.forEach((system) => {
    const a = document.createElement('a');
    a.classList = 'dropdown-item system-name';

    a.setAttribute('href', '#');
    a.textContent = system;
    dropdownMenu.appendChild(a);
  });
  dropdownContainer.style.display = 'none';
  checkbox.addEventListener('click', checkboxSelected);
  dropdownMenu.addEventListener('click', dropdownOptionSelected);
  speedrunSearchForm.addEventListener('submit', generateRandomSpeedrun);

  function checkboxSelected(e){
    if (dropdownContainer.style.display === 'none') {
      dropdownContainer.style.display = 'flex';
      dropdownContainer.style['flex-direction'] = 'column';
      dropdownContainer.style['align-items'] = 'center';
    } else {
      dropdownContainer.style.display = 'none';
      systemSelected = undefined;
    }
  }
  function dropdownOptionSelected(e){
    e.preventDefault();
    const system = e.target.textContent;
    systemSelected = system;
    dropdownMenuButton.textContent = system;
  }
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

      fetchSpeedrunData(systemSelected)
        .then((res) => {
          renderVideoDescription(res);
          renderVideo(res.videos.links[0].uri);
          $('#loading-modal').modal('hide');
        })
        .catch((err) => {
          $('#loading-modal').modal('hide');
          const errorMessage = document.getElementById('error-msg');
          errorMessage.textContent = err;
          $('#error-modal').modal('show');
        });
    } else {
      $('#error-modal').modal('show');
    }
  }
  function renderVideoDescription(data) {
    const title = document.createElement('h4');
    const subtitle = document.createElement('h5');
    const userLink = document.createElement('a');
    const userText = document.createElement('h5');
    const socialContainer = document.createElement('div');
    const iconBox = document.createElement('div');
    let iconExists = false;
    let divider;

    socialContainer.classList = 'd-flex justify-content-center';
    iconBox.classList = 'd-flex flex-row icon-box';
    title.textContent = `${data.game_name} | ${data.run_time}`;
    // check if date exists
    if (data.date) {
      subtitle.textContent = `${data.category} | ${data.date} | ${data.platform}`;
    } else {
      subtitle.textContent = `${data.category} | ${data.platform}`;
    }
    // international might break here
    // set text whether .names.international or .name if .names doesnt exist
    if (data.players.data[0].names) {
      userText.textContent = `${data.players.data[0].names.international}`;
    } else {
      userText.textContent = `${data.players.data[0].name}`;
    }
    userText.classList.add('links');
    userLink.setAttribute('href', data.players.data[0].weblink);

    if(data.players.data[0].twitch) {
      const twitchLink = document.createElement('a');
      const twitchIcon = document.createElement('i');
      twitchIcon.classList = 'fa fa-twitch fa-lg icon';
      twitchLink.setAttribute('href', data.players.data[0].twitch.uri);
      twitchLink.appendChild(twitchIcon);
      iconBox.appendChild(twitchLink);
      iconExists = true;
    }
    if(data.players.data[0].twitter) {
      const twitterLink = document.createElement('a');
      const twitterIcon = document.createElement('i');
      twitterIcon.classList = 'fa fa-twitter fa-lg icon';
      twitterLink.setAttribute('href', data.players.data[0].twitter.uri);
      twitterLink.appendChild(twitterIcon);
      iconBox.appendChild(twitterLink);
      iconExists = true;
    }
    if(data.players.data[0].youtube) {
      const youtubeLink = document.createElement('a');
      const youtubeIcon = document.createElement('i');
      youtubeIcon.classList = 'fa fa-youtube fa-lg icon';
      youtubeLink.setAttribute('href', data.players.data[0].youtube.uri);
      youtubeLink.appendChild(youtubeIcon);
      iconBox.appendChild(youtubeLink);
      iconExists = true;
    }
    if(iconExists) {
      divider = document.createElement('h5');
      divider.classList = 'divider';
      divider.textContent = ' | ';
    }
    videoDescription.appendChild(title);
    videoDescription.appendChild(subtitle);
    userLink.appendChild(userText);
    socialContainer.appendChild(iconBox);
    if(divider) {
      socialContainer.appendChild(divider);
    }
    socialContainer.appendChild(userLink);
    videoDescription.appendChild(socialContainer);
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
        throw 'Unsupported Video Type';
    }
  }
  function renderTwitchVideo(videoURL) {
      // URL types that are broken currently
      // "https://www.twitch.tv/blazephlozard/v/65615016"
      const checkStandard = '.tv/videos/';
      const checkAlternate = '/v/';
      let index;
      let videoId;
      if (videoURL.includes(checkStandard)) {
        index = videoURL.indexOf(checkStandard);
        videoId = videoURL.slice(index+checkStandard.length);
      } else {
        index = videoURL.indexOf(checkAlternate);
        videoId = videoURL.slice(index+checkAlternate.length);
      }
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
    // broken URL type "https://www.youtube.com/watch?v=rGh7EjJQjyI&feature=youtu.be"
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
    // twitchURL needs to also support http://
    const twitchURL = 'https://www.twitch.tv/';
    const twitchURL2 = 'http://www.twitch.tv/';
    const youtubeURL = 'https://www.youtube.com/';
    const youtubeShortURL = 'https://youtu.be/';
    const hitboxURL = '';
    const vimeoURL = '';
    const nicoVideoURL = '';
    const twitterURL = '';
    if (videoURL.includes(twitchURL) || videoURL.includes(twitchURL2)) {
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
      durationMax = 300;
    } else if (integer < 901) {
      durationMin = integer*0.75;
      durationMax = integer*1.5;
    } else if (integer < 1801) {
      durationMin = integer*0.85;
      durationMax = integer*1.35;
    } else if (integer < 7201) {
      durationMin = integer*0.85;
      durationMax = integer*1.15;
    } else if (integer < 14401) {
      durationMin = integer*0.80;
      durationMax = integer*1.20;
    } else {
      durationMin = 14401;
      durationMax = 9999999999999999999999999999999;
    }
    durationMin = Math.floor(durationMin);
    durationMax = Math.floor(durationMax);
  }
  function fetchSpeedrunData(system) {
    let databaseSliceToCheck = getRandomInt(numberOfRecordsInThousands);
    let urlToQuery = `${baseURL}${bulkURL}`;
    let offset = databaseSliceToCheck * 1000;
    if (!system) {
      if (databaseSliceToCheck === 0) {
        return getDatabaseSlice(urlToQuery);
      } else {
        urlToQuery += `&offset=${offset}`;
        return getDatabaseSlice(urlToQuery);
      }
    } else {
      return getDatabaseSliceBySystem(system)
    }
  }
  function getDatabaseSlice(urlToQuery) {
    return axios.get(urlToQuery)
      .then((response) => {
        let gameArrayToCheck = response.data.data;
        return getRandomGameData(gameArrayToCheck);
      });
  }
  function getDatabaseSliceBySystem(system, gameArray = [], offset) {
    return axios.get(`${baseURL}/platforms?max=200`)
      .then((response) => {
        systemsList = response.data.data;
        let call;
        systemsList.forEach((platform) => {
          if (platform.name === system) {
            call = platform.links[1].uri;
          }
        });
        if (offset) {
          return axios.get(`${call}&_bulk=yes&max=1000&offset=${offset}`);
        } else {
          return axios.get(`${call}&_bulk=yes&max=1000`);
        }
      })
      .then((response) => {
        if (gameArray.length < 1) {
          gameArray = response.data.data;
        } else {
          gameArray = gameArray.concat(response.data.data);
        }
        if (response.data.pagination.size === 1000) {
          offset = response.data.pagination.offset + 1000;
          return getDatabaseSliceBySystem(system, gameArray, offset);
        } else {
          return getRandomGameData(gameArray);
        }
      });

  }
  function getRandomGameData(array) {
    // reduce data formatting tasks here where possible
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
            if (pTime > durationMin-1 && pTime < durationMax+1) {
              if (videos) {
                if(!data) {
                  console.log('Success!');
                  data = {
                    run_id: run.id
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
          throw 'Something went wrong. Try your search again!';
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
        // international can trigger an error sometimes
        runInfoToSend.game_name = runInfo.game.data.names.international;
        runInfoToSend.platform = runInfo.platform.data.name;
        runInfoToSend.players = runInfo.players;
        runInfoToSend.videos = runInfo.videos;
        // check if data exists
        if (runInfo.date) {
          runInfoToSend.date = moment(runInfo.date).format('MMMM Do YYYY');
        }
        runInfoToSend.run_time = toHHMMSS(runInfo.times.primary_t);
        return runInfoToSend;
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
})(document, $);
