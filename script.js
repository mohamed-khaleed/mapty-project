'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
     this.description=`${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} at ${this.date.getDate()}`
  }
}
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription()
  }
  calcPace() {
    this.pace = this.duration / this.distance;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription()
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
  }
}

class App {
  #map;
  #mapClickEvent;
  #workouts = [];
  constructor() {
    this._getPosition();
    this._getLocalStorage()
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener("click",this._moveMarker.bind(this))
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('you did not accept to give us your coords');
      }
    );
  }
  _loadMap(position) {
    const { longitude } = position.coords;
    const { latitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, 15);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
    
    this.#workouts.forEach(work=>{
      this._renderWorkoutMarker(work)
    })
  }
  _showForm(mapE) {
    this.#mapClickEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    e.preventDefault();

    //get data from form
    const type = inputType.value;
    const distance = Number(inputDistance.value);
    const duration = Number(inputDuration.value);
    const { lat } = this.#mapClickEvent.latlng;
    const { lng } = this.#mapClickEvent.latlng;
    let workout;
    const validateFiniteNumbers = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const validatePositiveNumbers = (...inputs) => inputs.every(inp => inp > 0);
    // if workout is running create running object
    if (type === 'running') {
      const cadence = Number(inputCadence.value);
      if (
        !validateFiniteNumbers(distance, duration, cadence) ||
        !validatePositiveNumbers(distance, duration, cadence)
      )
        return alert('you have to enter a positive number');
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    // if workout is cycling create cycling object
    if (type === 'cycling') {
      const elevation = Number(inputElevation.value);
      if (
        !validateFiniteNumbers(distance, duration, elevation) ||
        !validatePositiveNumbers(distance, duration)
      )
        return alert('you have to enter a positive number');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    //add new object to workout array
    this.#workouts.push(workout);
   
    //render the workout to the map as a marker

    this._renderWorkoutMarker(workout);
    //render the workout to the list
    this._renderWorkoutList(workout);
    //hide the form
   this._hideForm()
    //set local storage
     this._setLocalStorage()

     
  }
  _hideForm(){
     inputDistance.value=inputDuration.value=inputCadence.value=inputElevation.value="";
     form.style.display="none"
     form.classList.add('hidden');
     setTimeout(() => {
      form.style.display="grid"
     }, 1000);
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${ workout.type === 'running' ? '🏃‍♂️' : ' 🚴‍♀️'}${workout.description}`)
      .openPopup();
  }
  _renderWorkoutList(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id=${workout.id}>
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : ' 🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
      `;

      if(workout.type=="running"){
        html+=`
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
        `
      }

    if(workout.type=="cycling"){
      html+=`
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `
    }
    form.insertAdjacentHTML("afterend",html)
  }

  _moveMarker(e){
     const workoutElement=e.target.closest(".workout");
     if(workoutElement==null) return;
  
     const workout= this.#workouts.find(wr=>wr.id===workoutElement.dataset.id)

     this.#map.setView(workout.coords,15,{
      animate:true,
      pan:{
        duration:1
      }
     })
  }

  _setLocalStorage(){
    localStorage.setItem("workouts",JSON.stringify(this.#workouts))
  }
  _getLocalStorage(){
    const data= JSON.parse(localStorage.getItem('workouts')) ;
    if(!data)return;
    this.#workouts=data;
    this.#workouts.forEach(work=>{
      this._renderWorkoutList(work)
    })
  }
}
const app = new App();


