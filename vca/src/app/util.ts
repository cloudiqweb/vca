import { AppConfig } from './app.config';

export function initConfig (config: AppConfig){
 return () => config.load() 
}