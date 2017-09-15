import { Pipe, PipeTransform } from '@angular/core';


@Pipe({ name: 'groupBy' })
export class GroupByPipe implements PipeTransform {
  transform(value: Array<any>, field: any, list: any[]): Array<any> {
    if (value && field) {
      list = field.list;
      const groupedObj = value.reduce((prev, cur) => {
        if (!prev[cur[field.data]]) {
          prev[cur[field.data]] = [cur];
        } else {
          prev[cur[field.data]].push(cur);
        }
        return prev;
      }, {});
      return Object.keys(groupedObj).map(key => (
        {
          key,
          value: groupedObj[key],
          name: list.filter(x => x.CategoryId.toString() === key)[0].CategoryName
        }
      )
      );
    }
  }
}

@Pipe({name: 'dataGroupBy'})
export class DataGroupByPipe implements PipeTransform {
  transform(value: Array<any>, field: string): Array<any> {
    const groupedObj = value.reduce((prev, cur)=> {
      if(!prev[cur[field]]) {
        prev[cur[field]] = [cur];
      } else {
        prev[cur[field]].push(cur);
      }
      return prev;
    }, {});
    return Object.keys(groupedObj).map(key => ({ key, value: groupedObj[key] }));
  }
}