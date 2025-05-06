import { Routes } from '@angular/router';
import { HomePage } from './home/home.page';
import { ChatPage } from './chat/chat.page';

export const PAGES_ROUTES: Routes = [
  { path: '', component: HomePage },
  { path: 'chat/:id', component: ChatPage }
];
