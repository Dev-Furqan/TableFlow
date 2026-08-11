import {randomUUID} from 'node:crypto';import {IntegrationEvent} from '../models/IntegrationEvent.js';

export type IntegrationEventType='MENU_ITEM_CREATED'|'MENU_ITEM_UPDATED'|'MENU_ITEM_DELETED'|'CATEGORY_CREATED'|'CATEGORY_UPDATED'|'CATEGORY_DELETED'|'MENU_AVAILABILITY_UPDATED'|'ORDER_STATUS_UPDATED';
export const queueIntegrationEvent=async(type:IntegrationEventType,data:Record<string,unknown>)=>{
  const payload={eventId:randomUUID(),type,occurredAt:new Date().toISOString(),source:'pos',version:1,data};
  return IntegrationEvent.create({eventId:payload.eventId,type,payload});
};

export const categoryDto=(category:any)=>({externalId:category.externalId,name:category.name,icon:category.icon,displayOrder:category.displayOrder,active:category.active,updatedAt:category.updatedAt?.toISOString?.()||category.updatedAt});
export const menuItemDto=(item:any,categoryExternalId?:string)=>({externalId:item.externalId,name:item.name,description:item.description,price:item.price,categoryExternalId, image:item.image,available:item.available,active:item.available,sku:item.sku,tags:item.tags||[],modifierGroups:item.modifierGroups||[],variants:item.variants||[],addons:item.addons||[],updatedAt:item.updatedAt?.toISOString?.()||item.updatedAt});

export const normalizedOrderStatus=(status:string)=>({draft:'pending',pending:'pending','sent-to-kitchen':'accepted',preparing:'preparing',ready:'ready',served:'out_for_delivery',completed:'completed',cancelled:'cancelled',refunded:'cancelled'} as Record<string,string>)[status]||'pending';
