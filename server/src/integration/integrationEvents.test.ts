import {describe,expect,it} from 'vitest';import {categoryDto,menuItemDto,normalizedOrderStatus} from './integrationEvents.js';

describe('integration event mapping',()=>{
  it('keeps external IDs and excludes POS-only menu cost data',()=>{const dto=menuItemDto({externalId:'menu-uuid',name:'Burger',price:900,cost:500,available:true,modifierGroups:[],variants:[],addons:[]},'category-uuid');expect(dto).toMatchObject({externalId:'menu-uuid',categoryExternalId:'category-uuid',price:900});expect(dto).not.toHaveProperty('cost');});
  it('maps POS order statuses without changing stored POS values',()=>{expect(normalizedOrderStatus('sent-to-kitchen')).toBe('accepted');expect(normalizedOrderStatus('refunded')).toBe('cancelled');});
  it('maps a category external ID',()=>expect(categoryDto({externalId:'category-uuid',name:'Burgers',active:true})).toMatchObject({externalId:'category-uuid',name:'Burgers'}));
});
