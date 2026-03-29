import { Component, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { SensorDashboardState, SensorEventRequestEnum, Event } from '../../../../core/models/sensor.model';

@Component({
  selector: 'app-sensor-info-panel',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule],
  templateUrl: './sensor-info-panel.component.html',
  styleUrl: './sensor-info-panel.component.css',
})
export class SensorInfoPanelComponent {

  sensor      = input.required<SensorDashboardState>();
  events      = input.required<Event[]>();       // historical events (REST)
  liveEvents  = input.required<Event[]>();       // all raw WS events
  close       = output<void>();

  private sanitizer = inject(DomSanitizer);

  // ── Derived ──────────────────────────────────────────────────────────────

  /** Merge historical + live events for this sensor, oldest first, limit to 20 total for chart */
  sensorEvents = computed(() => {
    const id = this.sensor().id;
    const historical = this.events().filter(e => e.sensor_id === id);
    const live = this.liveEvents().filter(e => e.sensor_id === id);
    // Deduplicate by id if present, live events take precedence
    const liveIds = new Set(live.map(e => e.id).filter(Boolean));
    const merged = [...live, ...historical.filter(e => !e.id || !liveIds.has(e.id))];
    
    // Sort and keep only the latest 20 for the chart
    return merged
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) // Newest first for slicing
      .slice(0, 20)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); // Oldest first for chart x-axis
  });

  mapSrc = computed<SafeResourceUrl>(() => {
    const { latitude: lat, longitude: lon } = this.sensor().coordinates;
    const delta = 0.15;
    const url = `https://www.openstreetmap.org/export/embed.html` +
      `?bbox=${lon - delta},${lat - delta},${lon + delta},${lat + delta}` +
      `&layer=mapnik&marker=${lat},${lon}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  frequencyChartOptions = computed<EChartsOption>(() => {
    const evs = this.sensorEvents();

    const xData  = evs.map(e => {
      const d = e.timestamp;
      return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    });
    const yData  = evs.map(e => e.dominant_frequency);
    const colors = evs.map(e => this.eventColor(e.category_event));

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15,23,42,0.95)',
        borderColor: '#334155',
        textStyle: { color: '#f8fafc', fontSize: 11 },
        formatter: (params: any) => {
          const p   = params[0];
          const ev  = evs[p.dataIndex];
          return `
            <div style="font-size:10px;line-height:1.6">
              <div style="font-weight:700;margin-bottom:2px">${p.axisValue}</div>
              <div>Frequency: <b>${ev.dominant_frequency.toFixed(2)} Hz</b></div>
              <div style="opacity:.7">${this.eventLabel(ev.category_event)}</div>
            </div>
          `;
        }
      },
      grid: { top: 24, right: 12, bottom: 28, left: 44, containLabel: true },
      xAxis: {
        type: 'category',
        data: xData,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#64748b', fontSize: 9, interval: 0, rotate: xData.length > 4 ? 35 : 0 }
      },
      yAxis: {
        type: 'value',
        name: 'Hz',
        nameTextStyle: { color: '#64748b', fontSize: 9 },
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
        axisLabel: { color: '#94a3b8', fontSize: 9 }
      },
      series: [{
        type: 'line',
        data: yData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { color: '#6366f1', width: 2 },
        itemStyle: { color: (params: any) => colors[params.dataIndex] },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(99,102,241,0.3)' }, { offset: 1, color: 'transparent' }]
        }},
        animationDuration: 600,
      }]
    };
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  private eventColor(cat: SensorEventRequestEnum | undefined): string {
    switch (cat) {
      case SensorEventRequestEnum.EARTHQUAKE:            return '#eab308';
      case SensorEventRequestEnum.CONVENTIONAL_EXPLOSION: return '#f97316';
      case SensorEventRequestEnum.NUCLEAR_LIKE:          return '#ef4444';
      default: return '#6366f1';
    }
  }

  eventLabel(cat: SensorEventRequestEnum | undefined): string {
    switch (cat) {
      case SensorEventRequestEnum.EARTHQUAKE:            return 'Earthquake';
      case SensorEventRequestEnum.CONVENTIONAL_EXPLOSION: return 'Conventional Explosion';
      case SensorEventRequestEnum.NUCLEAR_LIKE:          return 'Nuclear-like Event';
      default: return '—';
    }
  }

  eventColorClass(cat: SensorEventRequestEnum | undefined): string {
    switch (cat) {
      case SensorEventRequestEnum.EARTHQUAKE:            return 'text-yellow-400';
      case SensorEventRequestEnum.CONVENTIONAL_EXPLOSION: return 'text-orange-400';
      case SensorEventRequestEnum.NUCLEAR_LIKE:          return 'text-red-400 font-bold';
      default: return 'text-slate-400';
    }
  }
}
