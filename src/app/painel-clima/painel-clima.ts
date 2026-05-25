import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { PrevisaoTempo, RelatorioClima } from '../services/previsao-tempo';

@Component({
  selector: 'app-painel-clima',
  imports: [CommonModule, FormsModule],
  templateUrl: './painel-clima.html',
  styleUrl: './painel-clima.css',
})
export class PainelClima implements OnInit {
  cidade = 'Colatina';
  readonly cidadesPadrao = ['Colatina', 'Serra', 'Rio Bananal', 'Guarapari'];
  readonly carregando = signal(false);
  readonly erro = signal('');
  readonly relatorio = signal<RelatorioClima | null>(null);

  constructor(private readonly previsaoTempo: PrevisaoTempo) {}

  ngOnInit(): void {
    this.pesquisar();
  }

  pesquisar(): void {
    const nomeCidade = this.cidade.trim();

    if (!nomeCidade) {
      this.erro.set('Informe uma cidade para consultar a previsão.');
      return;
    }

    this.carregando.set(true);
    this.erro.set('');

    this.previsaoTempo
      .buscarClimaPorCidade(nomeCidade)
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (relatorio) => this.relatorio.set(relatorio),
        error: (error: Error) => this.erro.set(error.message || 'Não foi possível buscar o clima.'),
      });
  }

  usarCidadePadrao(cidade: string): void {
    this.cidade = cidade;
    this.pesquisar();
  }

  nomeLocal(relatorio: RelatorioClima): string {
    const estado = relatorio.city.admin1 ? `${relatorio.city.admin1}, ` : '';

    return `${relatorio.city.name} - ${estado}${relatorio.city.country}`;
  }

  atualizacaoFormatada(relatorio: RelatorioClima): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(relatorio.updatedAt));
  }
}
