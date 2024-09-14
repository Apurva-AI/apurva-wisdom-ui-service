import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-query',
  templateUrl: './query.component.html',
  styleUrls: ['./query.component.scss'],
})
export class QueryComponent implements OnInit {
  @Input() queryQuestion!: string;
  constructor() {}

  ngOnInit(): void {}
}
