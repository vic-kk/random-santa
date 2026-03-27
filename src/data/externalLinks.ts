export type TLinkItemKeys = 'url' | 'text'
export type TLinkItem = Record<TLinkItemKeys, string>;
export type TExternalLinks = Map<'community' | 'santa_form' , TLinkItem>

export const EXTERNAL_LINKS:TExternalLinks = new Map([
  [ 'community', {
    url: 'https://t.me/+omk7AIuSRmZmMjMy7',
    text: 'группа в TG'
  }],
  [ 'santa_form', {
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSdGnfGgwdcrFjc1ex4wWfqXuF7KC_reem0wZw_yQWgqfeyx2Q/viewform?usp=pp_url&entry.1901592428=',
    text: ''
  }],
]);
