import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWarehouses } from '../api/warehouses';
import {
  getLocation,
  listLocations,
  type LocationActiveFilter,
} from '../api/locations';
import './LocationsPage.css';

export function LocationsPage() {
  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [isActive, setIsActive] = useState<LocationActiveFilter>('true');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const locationsQuery = useQuery({
    queryKey: ['locations', page, search, warehouseId, isActive],
    queryFn: () =>
      listLocations({
        page,
        limit: 20,
        search: search.trim() || undefined,
        warehouseId: warehouseId ? Number(warehouseId) : undefined,
        isActive,
      }),
  });

  const warehousesQuery = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses,
  });

  const detailQuery = useQuery({
    queryKey: ['locations', selectedId],
    queryFn: () => getLocation(selectedId as number),
    enabled: selectedId !== null,
  });

  const rows = locationsQuery.data?.data ?? [];
  const meta = locationsQuery.data?.meta;
  const selected = detailQuery.data;

  const updateSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const updateWarehouse = (value: string) => {
    setWarehouseId(value);
    setPage(1);
  };

  const updateStatus = (value: LocationActiveFilter) => {
    setIsActive(value);
    setPage(1);
  };

  return (
    <div className="locations-page">
      <header className="locations-page__header">
        <div>
          <h1>Locations</h1>
          <p>Find warehouse locations and the stock stored at each one.</p>
        </div>
        {meta && <span className="locations-page__count">{meta.total} locations</span>}
      </header>

      <section className="locations-toolbar" aria-label="Filter locations">
        <label className="locations-toolbar__search">
          <span>Search name or code</span>
          <input
            type="search"
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="For example, Rack A1"
          />
        </label>
        <label>
          <span>Warehouse</span>
          <select value={warehouseId} onChange={(event) => updateWarehouse(event.target.value)}>
            <option value="">All warehouses</option>
            {(warehousesQuery.data ?? []).map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name} ({warehouse.code})
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Status</span>
          <select
            value={isActive}
            onChange={(event) => updateStatus(event.target.value as LocationActiveFilter)}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
            <option value="all">All statuses</option>
          </select>
        </label>
      </section>

      {locationsQuery.isError && (
        <div className="locations-message locations-message--error" role="alert">
          <span>Locations could not be loaded.</span>
          <button type="button" onClick={() => void locationsQuery.refetch()}>Retry</button>
        </div>
      )}

      <div className={`locations-layout${selectedId !== null ? ' locations-layout--selected' : ''}`}>
        <section className="locations-table-region" aria-label="Location list">
          {locationsQuery.isLoading ? (
            <p className="locations-message">Loading locations...</p>
          ) : rows.length === 0 ? (
            <div className="locations-message">
              <strong>{search || warehouseId ? 'No locations match these filters.' : 'No locations yet.'}</strong>
              <span>Try changing the search or warehouse filter.</span>
            </div>
          ) : (
            <>
              <div className="locations-table-scroll">
                <table className="locations-table">
                  <thead>
                    <tr>
                      <th scope="col">Location</th>
                      <th scope="col">Code</th>
                      <th scope="col">Warehouse</th>
                      <th scope="col">Availability</th>
                      <th scope="col"><span className="visually-hidden">Details</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((location) => (
                      <tr key={location.id} className={selectedId === location.id ? 'is-selected' : ''}>
                        <td>{location.name}</td>
                        <td className="locations-table__code">{location.code}</td>
                        <td>{location.warehouseName} <span className="locations-table__muted">({location.warehouseCode})</span></td>
                        <td>
                          <span className={`location-status${location.isAvailable ? ' location-status--available' : ' location-status--unavailable'}`}>
                            {location.isAvailable ? 'Available' : location.isActive ? 'Warehouse inactive' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="locations-table__view"
                            onClick={() => setSelectedId(location.id)}
                            aria-label={`View stock at ${location.name}`}
                          >
                            View stock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {meta && meta.totalPages > 1 && (
                <div className="locations-pagination">
                  <span>Page {meta.page} of {meta.totalPages}</span>
                  <div>
                    <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
                    <button type="button" disabled={page >= meta.totalPages} onClick={() => setPage((current) => current + 1)}>Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {selectedId !== null && (
          <aside className="location-detail" aria-label="Selected location stock">
            <div className="location-detail__header">
              <div>
                <h2>{selected?.name ?? 'Location stock'}</h2>
                {selected && <p>{selected.code} · {selected.warehouseName}</p>}
              </div>
              <button type="button" className="location-detail__close" onClick={() => setSelectedId(null)} aria-label="Close location details">×</button>
            </div>

            {detailQuery.isLoading ? (
              <p className="locations-message">Loading stock...</p>
            ) : detailQuery.isError ? (
              <div className="locations-message locations-message--error" role="alert">
                <span>Stock details could not be loaded.</span>
                <button type="button" onClick={() => void detailQuery.refetch()}>Retry</button>
              </div>
            ) : selected?.stockSummary.length ? (
              <div className="location-detail__stock">
                {selected.stockSummary.map((item) => (
                  <article key={item.productId} className="location-stock-row">
                    <div>
                      <strong>{item.productName}</strong>
                      <span>{item.sku}</span>
                    </div>
                    <dl>
                      <div><dt>On hand</dt><dd>{item.onHand}</dd></div>
                      <div><dt>Reserved</dt><dd>{item.reserved}</dd></div>
                      <div><dt>Free to use</dt><dd>{item.freeToUse}</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
            ) : (
              <p className="locations-message">No stock is recorded at this location.</p>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}