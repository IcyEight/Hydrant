import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
import { HttpClient } from '@angular/common/http';

declare var google;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})

export class HomePage {
	@ViewChild('map') mapElement : ElementRef;
	map : any;
  data : any;
  markerCache : any[] = [];

  constructor(public navCtrl: NavController, public geolocation: Geolocation, public http: HttpClient) {
    this.http.get('http://localhost:8100/assets/hydrants.json')
    .subscribe(data => {
      this.data = data;
    });
  }

  ionViewDidLoad(){
  	this.loadMap();
  }

  loadMap(){
  	this.geolocation.getCurrentPosition().then((position) => {
  		let latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
	  	let mapOptions = {
	  		center : latLng,
	  		zoom : 15,
	  		mapTypeId : google.maps.MapTypeId.SATELLITE
	  	};

	  	this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

      // google.maps.event.addListenerOnce(this.map, 'idle', function(){
      //   this.loadMarkers();
      // });
 
        //Reload markers every time the map moves
        let me = this;
        google.maps.event.addListener(this.map, 'dragend', function(){
          console.log("moved!");
          me.loadMarkers();
        });
 
      //   //Reload markers every time the zoom changes
      //   google.maps.event.addListener(this.map, 'zoom_changed', function(){
      //     console.log("zoomed!");
      //     this.loadMarkers();
      //   });

  	}, (err) => {
  		console.log(err);
  	}); 
  }

   loadMarkers(){

      var center = this.map.getCenter();
      var bounds = this.map.getBounds();
      var zoom = this.map.getZoom();
 
      //Convert objects returned by Google to be more readable
      var centerNorm = {
          lat: center.lat(),
          lng: center.lng()
      };
 
      var boundsNorm = {
          northeast: {
              lat: bounds.getNorthEast().lat(),
              lng: bounds.getNorthEast().lng()
          },
          southwest: {
              lat: bounds.getSouthWest().lat(),
              lng: bounds.getSouthWest().lng()
          }
      };
 
      var boundingRadius = this.getBoundingRadius(centerNorm, boundsNorm);
 
      var params = {
        "centre": centerNorm,
        "bounds": boundsNorm,
        "zoom": zoom,
        "boundingRadius": boundingRadius
      };
 

      let records = this.getMarkers(params); 
      for (let i = 0; i < records.length; i++) {

        let record = records[i];   // {"lat":39.8852,"lng":-75.064254,"OutOfService":false,"Critical":false,"CriticalNotes":null}
      if (!this.markerExists(record.lat, record.lng)) {
        let markerPos = new google.maps.LatLng(record.lat, record.lng);

        // Add the markerto the map
        let marker = new google.maps.Marker({
            map: this.map,
            animation: google.maps.Animation.DROP,
            position: markerPos
        });

        // Add the marker to the markerCache so we know not to add it again later
              var markerData = {
                lat: record.lat,
                lng: record.lng,
                marker: marker
              };
//console.log("printing "+this.markerCache);
              this.markerCache.push(markerData);

        let infoWindowContent = "<h4>" 
        + "OutOfService :" + record.OutOfService + ", " 
        + "Critical :" + record.Critical + ", " 
        + "CriticalNotes :" + record.CriticalNotes + ", " 
        + "</h4>";

        this.addInfoWindow(marker, infoWindowContent, record);
    }
  }
  }
 
getMarkers(params){
 let result = [];
    let records = this.data;
    for(let i = 0; i < records.length; i++)
    {
      let record = records[i];
      if(Math.abs(record.lat - params.centre.lat) <= params.boundingRadius &&
        Math.abs(record.lng - params.centre.lng) <= params.boundingRadius)
      {
     //   console.log("printing result "+result);

         result.push(record);
      }
    }
    return result; 
    }

   addInfoWindow(marker, message, record) {
 
      let infoWindow = new google.maps.InfoWindow({
          content: message
      });
 
      google.maps.event.addListener(marker, 'click', function () {
          infoWindow.open(this.map, marker);
      });
 
  }

   markerExists(lat, lng){
      var exists = false;
      var cache = this.markerCache;
      for(var i = 0; i < cache.length; i++){
        if(cache[i].lat === lat && cache[i].lng === lng){
          exists = true;
        }
      }
 
      return exists;
  }

 getBoundingRadius(center, bounds){
    return this.getDistanceBetweenPoints(center, bounds.northeast, 'miles');   
  }

 getDistanceBetweenPoints(pos1, pos2, units){
 
    var earthRadius = {
        miles: 3958.8,
        km: 6371
    };
 
    var R = earthRadius[units || 'miles'];
    var lat1 = pos1.lat;
    var lon1 = pos1.lng;
    var lat2 = pos2.lat;
    var lon2 = pos2.lng;
 
    var dLat = this.toRad((lat2 - lat1));
    var dLon = this.toRad((lon2 - lon1));
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
 
    return d;
 
  }

 toRad(x){
      return x * Math.PI / 180;
  }

  addMarker(){
  	let marker = new google.maps.Marker({
  		map : this.map,
  		animation : google.maps.Animation.DROP,
  		position : this.map.getCenter()
  	});

  	let content = "<h4>Information</h4>";
  	this.oldAddInfoWindow(marker,content);
  }

  oldAddInfoWindow(marker, content){
  	let infoWindow = new google.maps.InfoWindow({
  		content: content
  	});

  	google.maps.event.addListener(marker,'click',() => {
  		infoWindow.open(this.map, marker);
  	});
  }
}
