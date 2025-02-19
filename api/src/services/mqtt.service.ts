// Create a service for MQTT functionality
import mqtt, { MqttClient } from 'mqtt';
import { DeviceData, MQTT_CONFIG, DEVICE_TOPICS } from '../types';

export class MQTTService {
  private client: MqttClient;
  private publishInterval: NodeJS.Timeout | null = null;
  private isPublishing: boolean = false;

  constructor() {
    this.client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
      clean: true,
      connectTimeout: 30000,
      keepalive: 60,
      reconnectPeriod: 1000
    });

    this.client.on('connect', () => {
      console.log('Connected to MQTT broker');
      this.startPublishing();
    });
  }

  private generateDeviceData(): DeviceData {
    return {
      time: Date.now(),
      temp: parseFloat((Math.random() * 40).toFixed(2)),
      hum: parseFloat((Math.random() * 50 + 30).toFixed(2))
    };
  }

  public startPublishing(): void {
    if (this.isPublishing) {
      return;
    }

    this.isPublishing = true;

    // Clear any existing interval
    if (this.publishInterval) {
      clearInterval(this.publishInterval);
      this.publishInterval = null;
    }

    // Set up new interval
    this.publishInterval = setInterval(() => {
      DEVICE_TOPICS.forEach((topic: string) => {
        const data = this.generateDeviceData();
        this.publish(topic, data);
      });
    }, 5000);
  }

  public stopPublishing(): void {
    this.isPublishing = false;
    if (this.publishInterval) {
      clearInterval(this.publishInterval);
      this.publishInterval = null;
    }
  }

  public publish(topic: string, data: DeviceData): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.publish(topic, JSON.stringify(data), (error?: Error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  public getPublishingStatus(): boolean {
    return this.isPublishing;
  }

  public cleanup(): void {
    // Stop publishing
    this.stopPublishing();
    // Close MQTT connection
    this.client.end();
  }
}

export default new MQTTService(); 