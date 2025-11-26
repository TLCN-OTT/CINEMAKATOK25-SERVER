import { AxiosResponse } from 'axios';
import { of } from 'rxjs';

import { HttpService } from '@nestjs/axios';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { MovieService } from '../movie.service';
import { RecommendService } from '../recommend.service';
import { TvSeriesService } from '../tvseries.service';

describe('RecommendService', () => {
  let service: RecommendService;
  let httpService: HttpService;
  let movieService: MovieService;
  let tvSeriesService: TvSeriesService;

  const mockMovie = {
    id: 'movie-1',
    metaData: { title: 'Test Movie' },
  } as any;

  const mockTVSeries = {
    id: 'tv-1',
    metaData: { title: 'Test TV Series' },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: MovieService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: TvSeriesService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RecommendService>(RecommendService);
    httpService = module.get<HttpService>(HttpService);
    movieService = module.get<MovieService>(MovieService);
    tvSeriesService = module.get<TvSeriesService>(TvSeriesService);

    jest.clearAllMocks();
  });

  describe('getFastApiData', () => {
    it('should return recommendations from FastAPI', async () => {
      const mockResponse: AxiosResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
        data: {
          recommendations: [
            { itemid: 'movie-1', type: 'MOVIE' },
            { itemid: 'tv-1', type: 'TVSERIES' },
          ],
        },
      };
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));
      jest.spyOn(movieService, 'findOne').mockResolvedValue(mockMovie);
      jest.spyOn(tvSeriesService, 'findOne').mockResolvedValue(mockTVSeries);

      const result = await service.getFastApiData('user-1', 10);

      expect(result.movies).toEqual([mockMovie]);
      expect(result.tvSeries).toEqual([mockTVSeries]);
    });

    it('should return empty if no recommendations', async () => {
      const mockResponse: AxiosResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
        data: { recommendations: [] },
      };
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      const result = await service.getFastApiData('user-1', 10);

      expect(result).toEqual({ movies: [], tvSeries: [] });
    });

    it('should throw BadRequestException if FastAPI fails', async () => {
      const mockResponse: AxiosResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as any,
        data: {},
      };
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      await expect(service.getFastApiData('user-1', 10)).rejects.toThrow(BadRequestException);
    });
  });
});
