// src/types/device-types.ts

/**
 * Represents an element recognized from the app's UI
 */
export interface RecognizedElement {
    id: string;
    label: string;
    boundingBox: number[];
    type?: string;
  }
  
  /**
   * Detailed representation of an element in the app
   */
  export interface AppElement {
    id: string;
    type: string;
    text: string;
    location: { x: number; y: number };
    size: { width: number; height: number };
    isEnabled: boolean;
    isVisible: boolean;
  }
  
  /**
   * Information about the device running the app
   */
  export interface DeviceInfo {
    name: string;
    platform: string;
    version: string;
  }
  
  /**
   * Represents the current state of the app
   */
  export interface AppContext {
    currentView: string;
    pageSource: string;
    elements: AppElement[];
    hierarchy: string;
    metadata: {
      timestamp: number;
      deviceInfo: DeviceInfo;
    };
  }
  
  /**
   * Represents a UI element to interact with
   */
  export interface ElementInteraction {
    type: 'tap' | 'type' | 'swipe' | 'scroll';
    name: string;
    x: number;
    y: number;
    value?: string; // For type actions
    direction?: 'up' | 'down' | 'left' | 'right'; // For swipe/scroll actions
  }
  
  /**
   * Represents a point on the screen
   */
  export interface Point {
    x: number;
    y: number;
  }
  
  /**
   * Represents a rectangle on the screen
   */
  export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
  }
  
  /**
   * Information needed to find an element
   */
  export interface ElementInfo {
    name: string;
    type: string;
    isInput?: boolean;
  }
  
  /**
   * Result of an element search operation
   */
  export interface ElementSearchResult {
    found: boolean;
    element?: any; // WebdriverIO element
    strategy?: string;
    selector?: string;
    error?: string;
  }
  