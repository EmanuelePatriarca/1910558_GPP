import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SensorDashboardState, SensorEventRequestEnum, SensorCategoryEnum } from '../../core/models/sensor.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  host: { class: 'flex flex-col flex-1 min-h-0 w-full' }
})
export class DashboardComponent {

  // Mock data conforme ai modelli JSON specificati
  sensors = signal<SensorDashboardState[]>([
    { 
      id: '1', name: 'Borealis Ridge', category: SensorCategoryEnum.FIELD, region: 'North Atlantic',
      coordinates: { latitude: 70.1, longitude: -40.5 }, measurement_unit: 'Hz', sampling_rate_hz: 100,
      lastEvent: { id: 'e1', category_event: SensorEventRequestEnum.EARTHQUAKE, dominant_frequency: 1.2, timestamp: new Date() }
    },
    { 
      id: '2', name: 'Atlas Escarpment', category: SensorCategoryEnum.FIELD, region: 'Pacific Trench',
      coordinates: { latitude: 10.1, longitude: 140.5 }, measurement_unit: 'Hz', sampling_rate_hz: 100
    },
    { 
      id: '3', name: 'Kestrel Basin', category: SensorCategoryEnum.FIELD, region: 'Indian Ocean',
      coordinates: { latitude: -20.1, longitude: 80.5 }, measurement_unit: 'Hz', sampling_rate_hz: 100
    },
    { 
      id: '4', name: 'Ember Fault', category: SensorCategoryEnum.FIELD, region: 'Ring of Fire',
      coordinates: { latitude: 35.1, longitude: -120.5 }, measurement_unit: 'Hz', sampling_rate_hz: 100
    },
    { 
      id: '5', name: 'Helios Shelf', category: SensorCategoryEnum.FIELD, region: 'Pacific Trench',
      coordinates: { latitude: 5.1, longitude: 130.5 }, measurement_unit: 'Hz', sampling_rate_hz: 100,
      lastEvent: { id: 'e2', category_event: SensorEventRequestEnum.NUCLEAR_LIKE, dominant_frequency: 9.5, timestamp: new Date() }
    },
    { 
      id: '6', name: 'Tundra Line', category: SensorCategoryEnum.FIELD, region: 'Arctic Circle',
      coordinates: { latitude: 80.1, longitude: -10.5 }, measurement_unit: 'Hz', sampling_rate_hz: 100
    },
    { 
      id: '7', name: 'Argent Plateau', category: SensorCategoryEnum.FIELD, region: 'South Atlantic',
      coordinates: { latitude: -40.1, longitude: -60.5 }, measurement_unit: 'Hz', sampling_rate_hz: 100
    },
    { 
      id: '8', name: 'DC North Perimeter', category: SensorCategoryEnum.DATACENTER, region: 'Zone A',
      coordinates: { latitude: 0, longitude: 0 }, measurement_unit: 'Hz', sampling_rate_hz: 100
    },
    { 
      id: '9', name: 'DC East Cooling Hall', category: SensorCategoryEnum.DATACENTER, region: 'Zone A',
      coordinates: { latitude: 0, longitude: 0 }, measurement_unit: 'Hz', sampling_rate_hz: 100
    },
    { 
      id: '10', name: 'DC Core Slab', category: SensorCategoryEnum.DATACENTER, region: 'Zone A',
      coordinates: { latitude: 0, longitude: 0 }, measurement_unit: 'Hz', sampling_rate_hz: 100
    },
    { 
      id: '11', name: 'DC South Power Bus', category: SensorCategoryEnum.DATACENTER, region: 'Zone A',
      coordinates: { latitude: 0, longitude: 0 }, measurement_unit: 'Hz', sampling_rate_hz: 100
    },
    { 
      id: '12', name: 'DC West Access', category: SensorCategoryEnum.DATACENTER, region: 'Zone A',
      coordinates: { latitude: 0, longitude: 0 }, measurement_unit: 'Hz', sampling_rate_hz: 100,
      lastEvent: { id: 'e3', category_event: SensorEventRequestEnum.CONVENTIONAL_EXPLOSION, dominant_frequency: 4.5, timestamp: new Date() }
    },
  ]);

  fieldSensors = computed(() => this.sensors().filter(s => s.category === SensorCategoryEnum.FIELD));
  datacenterSensors = computed(() => this.sensors().filter(s => s.category === SensorCategoryEnum.DATACENTER));

  getSensorColorTheme(event?: SensorEventRequestEnum): string {
    switch(event) {
      case SensorEventRequestEnum.EARTHQUAKE: 
        return 'bg-yellow-400 border-yellow-500 text-yellow-900';
      case SensorEventRequestEnum.CONVENTIONAL_EXPLOSION: 
        return 'bg-amber-500 border-amber-600 text-amber-950';
      case SensorEventRequestEnum.NUCLEAR_LIKE: 
        return 'bg-red-600 border-red-700 text-white';
      default: 
        return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400';
    }
  }

  // Helper template
  getEventLabel(event?: SensorEventRequestEnum): string {
    switch(event) {
      case SensorEventRequestEnum.EARTHQUAKE: return 'Earthquake';
      case SensorEventRequestEnum.CONVENTIONAL_EXPLOSION: return 'Conventional Explosion';
      case SensorEventRequestEnum.NUCLEAR_LIKE: return 'Nuclear-like Activity';
      default: return 'OK';
    }
  }
}
