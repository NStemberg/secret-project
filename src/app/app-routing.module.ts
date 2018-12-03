import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {JumpNRunComponent} from './Games/jump-n-run.component';
import {ScrollComponent} from './Games/scroll.component';
import {AppComponent} from './app.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'jump',
        component: JumpNRunComponent,
        pathMatch: 'full'
      },
      {
        path: 'scroll',
        component: ScrollComponent,
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ]
})

export class AppRoutingModule {
}
