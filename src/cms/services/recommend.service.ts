// app.service.ts
import { lastValueFrom } from 'rxjs';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';

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
    try {
      const response$ = this.httpService.get(
        `http://127.0.0.1:8000/recommend/${userId}?top_n=${top_n}`,
        {},
      );
      const response = await lastValueFrom(response$);
      if (response.status !== 200) {
        throw new BadRequestException({
          message: 'Failed to fetch recommendations from FastAPI service',
          code: ERROR_CODE.FASTAPI_RECOMMENDATION_ERROR,
        });
      }
      const recommendations = response.data.recommendations;

      if (!recommendations || recommendations.length === 0) {
        return { movies: [], tvSeries: [] };
      }

      const movies: any[] = [];
      const tvSeries: any[] = [];

      for (const rec of recommendations) {
        try {
          if (rec.type === 'MOVIE') {
            const movie = await this.movieService.findOne(rec.itemid);
            if (movie) movies.push(movie);
          } else if (rec.type === 'TVSERIES') {
            const series = await this.tvSeriesService.findOne(rec.itemid);
            if (series) tvSeries.push(series);
          }
        } catch (error) {
          // Log lỗi cho item cụ thể, bỏ qua để tiếp tục
        }
      }
      return { movies, tvSeries };
    } catch (error) {
      // Xử lý lỗi Axios (e.g., 404) hoặc lỗi khác
      if (error.response?.status === 404) {
        return { movies: [], tvSeries: [] }; // Fallback
      }
      throw new BadRequestException({
        message: 'Unexpected error in recommendation service',
        code: ERROR_CODE.UNEXPECTED_ERROR,
      });
    }
  }
}
