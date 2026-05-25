import { Component } from '@angular/core';

import { PainelClima } from './painel-clima/painel-clima';

@Component({
  selector: 'app-root',
  imports: [PainelClima],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
}
