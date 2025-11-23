// app.service.ts
import { lastValueFrom } from 'rxjs';

import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';

import { MovieService } from './movie.service';
import { TvSeriesService } from './tvseries.service';

@Injectable()
export class RecommendService {
  constructor(
    private httpService: HttpService,
    private readonly movieService: MovieService,
    private readonly tvSeriesService: TvSeriesService,
  ) {}

  async getFastApiData(userId: string, top_n: number): Promise<any> {
    const response$ = this.httpService.get(
      `http://127.0.0.1:8000/recommend/${userId}?top_n=${top_n}`,
      {},
    );
    const response = await lastValueFrom(response$);
    const recommendations = response.data.recommendations;

    const movies: any[] = [];
    const tvSeries: any[] = [];

    for (const rec of recommendations) {
      if (rec.type === 'MOVIE') {
        const movie = await this.movieService.findOne(rec.itemid);
        if (movie) movies.push(movie);
      } else if (rec.type === 'TVSERIES') {
        const series = await this.tvSeriesService.findOne(rec.itemid);
        if (series) tvSeries.push(series);
      }
    }
    return { movies, tvSeries };
  }
}
